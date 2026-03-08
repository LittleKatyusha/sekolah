/**
 * Echo Service – Laravel Echo wrapper (Reverb / Pusher protocol)
 *
 * Drop-in replacement for websocketService with the same public API:
 *   connect(token)
 *   disconnect()
 *   subscribe(channel)
 *   unsubscribe(channel)
 *   on(event, fn)  → returns unsubscribe fn
 *   off(event, fn)
 *   get status
 *
 * Built-in service events (same as wsService):
 *   "status"       → (status: string)  connection state changed
 *   "message"      → (frame: object)   raw { channel, event, data }
 *   "notification" → (data: object)    server pushed a notification
 *
 * Channel events are namespaced as "<channel>:<event>", e.g.:
 *   "forum.42:new-reply"
 *
 * Private channels:
 *   Any channel listed in PRIVATE_CHANNELS, or channels prefixed with
 *   "private-", are joined via echo.private().  All others are public.
 *   Private channels require the backend's /api/broadcasting/auth endpoint.
 */

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally (required by laravel-echo)
window.Pusher = Pusher

// Channels that require a private subscription (auth)
const PRIVATE_CHANNELS = new Set(['notifications'])

// Pusher internal event prefixes to suppress from listeners
const PUSHER_INTERNAL = 'pusher:'

class EchoService {
  constructor() {
    this._echo           = null
    this._token          = null
    this._status         = 'disconnected' // connecting | connected | disconnected | error
    this._listeners      = {}             // { [event]: Set<fn> }
    this._channels       = new Map()      // channelName → Echo channel instance
    this._pendingChannels = new Set()     // channels requested before connect
  }

  // ─── Public API (same surface as websocketService) ────────────────────────

  /**
   * Initialise the Echo connection with a JWT token.
   * Subsequent token changes should use updateToken() to avoid reconnecting
   * and resubscribing every active channel.
   */
  connect(token) {
    if (!token) return
    this._token = token

    if (this._echo) {
      this.updateToken(token)
      return
    }

    this._initEcho(token)
  }

  updateToken(token) {
    if (!token) return

    this._token = token

    if (!this._echo) return

    const authHeader = `Bearer ${token}`

    if (this._echo.options?.auth?.headers) {
      this._echo.options.auth.headers.Authorization = authHeader
    }

    if (this._echo.connector?.options?.auth?.headers) {
      this._echo.connector.options.auth.headers.Authorization = authHeader
    }

    if (this._echo.connector?.pusher?.config?.channelAuthorization?.headers) {
      this._echo.connector.pusher.config.channelAuthorization.headers.Authorization = authHeader
    }
  }

  disconnect() {
    this._teardown()
    this._token = null
    this._setStatus('disconnected')
  }

  /** Subscribe to a backend channel (e.g. "forum.42", "notifications"). */
  subscribe(channel) {
    if (this._channels.has(channel)) return  // already subscribed
    if (!this._echo) {
      this._pendingChannels.add(channel)
      return
    }
    this._joinChannel(channel)
  }

  /** Unsubscribe from a backend channel. */
  unsubscribe(channel) {
    if (!this._echo) {
      this._pendingChannels.delete(channel)
      return
    }
    const ch = this._channels.get(channel)
    if (!ch) return

    if (this._isPrivate(channel)) {
      const name = this._stripPrivatePrefix(channel)
      this._echo.leaveChannel(`private-${name}`)
    } else {
      this._echo.leaveChannel(channel)
    }
    this._channels.delete(channel)
  }

  /**
   * Register a listener.
   * Returns an unsubscribe function (same as wsService.on).
   */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = new Set()
    this._listeners[event].add(fn)
    return () => this.off(event, fn)
  }

  off(event, fn) {
    this._listeners[event]?.delete(fn)
  }

  get status() {
    return this._status
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  _isPrivate(channel) {
    return PRIVATE_CHANNELS.has(channel) || channel.startsWith('private-')
  }

  _stripPrivatePrefix(channel) {
    return channel.startsWith('private-') ? channel.slice('private-'.length) : channel
  }

  _joinChannel(channel) {
    if (!this._echo) return

    let echoChannel
    if (this._isPrivate(channel)) {
      echoChannel = this._echo.private(this._stripPrivatePrefix(channel))
    } else {
      echoChannel = this._echo.channel(channel)
    }

    this._channels.set(channel, echoChannel)

    // Capture every event broadcast on this channel
    echoChannel.listenToAll((pusherEvent, data) => {
      // Ignore Pusher-internal events (subscription_succeeded, etc.)
      if (pusherEvent.startsWith(PUSHER_INTERNAL)) return

      // Strip the leading dot Laravel Echo adds to custom event names
      const event = pusherEvent.startsWith('.') ? pusherEvent.slice(1) : pusherEvent

      // channel:event – consumed by useWebSocket listeners
      this._emit(`${channel}:${event}`, data)

      // Raw message frame – consumed by '*' wildcard handlers
      this._emit('message', { channel, event, data })

      // Surface notification-channel events as top-level "notification"
      // so App.jsx / useNotificationStore works the same as before
      if (channel === 'notifications') {
        this._emit('notification', data)
      }
    })

    return echoChannel
  }

  _initEcho(token) {
    this._setStatus('connecting')

    const env = import.meta.env
    const appKey = env.VITE_REVERB_APP_KEY || env.VITE_PUSHER_APP_KEY
    const wsHost = env.VITE_REVERB_HOST || window.location.hostname
    const rawPort = Number(env.VITE_REVERB_PORT)
    const wsPort = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 443
    const forceTLS = (env.VITE_REVERB_SCHEME || 'wss') === 'wss'

    if (!appKey || !wsHost) {
      console.warn('[Echo] missing Reverb/Pusher configuration. Set VITE_REVERB_APP_KEY (or VITE_PUSHER_APP_KEY) and VITE_REVERB_HOST.')
      this._setStatus('error')
      return
    }

    try {
      this._echo = new Echo({
        broadcaster: 'reverb',
        key: appKey,
        wsHost,
        wsPort,
        wssPort: wsPort,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
        // Broadcasting auth endpoint (Laravel standard)
        authEndpoint: `${env.VITE_API_BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      })
    } catch (err) {
      console.error('[Echo] failed to initialize:', err)
      this._setStatus('error')
      return
    }

    // Bind to Pusher connection state changes
    const conn = this._echo.connector.pusher.connection
    conn.bind('state_change', ({ current }) => {
      const map = {
        connecting:   'connecting',
        connected:    'connected',
        disconnected: 'disconnected',
        unavailable:  'error',
        failed:       'error',
      }
      this._setStatus(map[current] ?? current)
    })
    conn.bind('error', (err) => {
      console.error('[Echo] connection error:', err?.error?.data?.message ?? err)
    })

    // Subscribe any channels that were requested before connect()
    this._pendingChannels.forEach(ch => this._joinChannel(ch))
    this._pendingChannels.clear()
    this.updateToken(token)
  }

  _teardown() {
    if (this._echo) {
      this._echo.disconnect()
      this._echo = null
    }
    this._channels.clear()
  }

  _emit(event, data) {
    this._listeners[event]?.forEach(fn => {
      try { fn(data) } catch (err) {
        console.error('[Echo] listener error', err)
      }
    })
  }

  _setStatus(status) {
    this._status = status
    this._emit('status', status)
  }
}

// Singleton – one Echo connection per browser tab
const echoService = new EchoService()
export default echoService
