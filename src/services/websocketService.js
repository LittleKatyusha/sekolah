/**
 * WebSocket Service
 *
 * Handles a persistent WebSocket connection to the backend with:
 * - JWT-based authentication (token sent on connect)
 * - Channel-based pub/sub subscriptions
 * - Auto-reconnect with exponential backoff (max 30 s)
 * - Heartbeat (ping every 25 s) to keep the connection alive
 * - Clean teardown when the user logs out
 *
 * Protocol (JSON frames):
 *   Client → Server
 *     { type: "authenticate", token: "<jwt>" }
 *     { type: "subscribe",   channel: "forum.42" }
 *     { type: "unsubscribe", channel: "forum.42" }
 *     { type: "ping" }
 *
 *   Server → Client
 *     { type: "authenticated" }
 *     { type: "subscribed",   channel: "forum.42" }
 *     { type: "message", channel: "forum.42", event: "new-reply", data: {...} }
 *     { type: "notification", event: "...", data: {...} }
 *     { type: "pong" }
 *     { type: "error", message: "..." }
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || (
  import.meta.env.DEV
    // In dev Vite proxies /ws → wss://api.akademihub.id/ws  (ws: true in vite.config.js)
    ? `ws://${window.location.host}/ws`
    : `wss://api.akademihub.id/ws`
)

const RECONNECT_BASE_DELAY = 1_000   // 1 s
const RECONNECT_MAX_DELAY  = 30_000  // 30 s
const PING_INTERVAL        = 25_000  // 25 s

class WebSocketService {
  constructor() {
    this._ws           = null
    this._token        = null
    this._status       = 'disconnected' // 'connecting' | 'connected' | 'disconnected' | 'error'
    this._listeners    = {}   // { [event]: Set<fn> }
    this._channels     = new Set()
    this._pingTimer    = null
    this._reconnectTimer = null
    this._reconnectDelay = RECONNECT_BASE_DELAY
    this._manualClose  = false
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  connect(token) {
    if (!token) return
    this._token = token
    this._manualClose = false
    this._open()
  }

  disconnect() {
    this._manualClose = true
    this._cleanup()
    this._setStatus('disconnected')
  }

  /** Subscribe to a backend channel (e.g. "forum.42", "notifications") */
  subscribe(channel) {
    this._channels.add(channel)
    if (this._status === 'connected') {
      this._send({ type: 'subscribe', channel })
    }
  }

  /** Unsubscribe from a backend channel */
  unsubscribe(channel) {
    this._channels.delete(channel)
    if (this._status === 'connected') {
      this._send({ type: 'unsubscribe', channel })
    }
  }

  /**
   * Listen for events emitted by this service.
   *
   * Built-in service events:
   *   "status"           → (status: string) connection status changed
   *   "message"          → (frame: object)  raw server frame
   *   "notification"     → (data: object)   server pushed a notification
   *
   * Channel events are namespaced as "<channel>:<event>", e.g.:
   *   "forum.42:new-reply"
   */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = new Set()
    this._listeners[event].add(fn)
    return () => this.off(event, fn)  // returns an unsubscribe fn
  }

  off(event, fn) {
    this._listeners[event]?.delete(fn)
  }

  get status() {
    return this._status
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _open() {
    if (this._ws) this._cleanup()

    this._setStatus('connecting')

    try {
      const url = `${WS_BASE_URL}?token=${encodeURIComponent(this._token)}`
      this._ws = new WebSocket(url)
    } catch (err) {
      this._setStatus('error')
      this._scheduleReconnect()
      return
    }

    this._ws.onopen = () => {
      this._reconnectDelay = RECONNECT_BASE_DELAY
      // Authenticate (token is also in the URL query-string as a fallback)
      this._send({ type: 'authenticate', token: this._token })
      this._setStatus('connected')
      // Re-subscribe to all tracked channels
      this._channels.forEach(ch => this._send({ type: 'subscribe', channel: ch }))
      this._startPing()
    }

    this._ws.onmessage = (ev) => {
      let frame
      try { frame = JSON.parse(ev.data) } catch { return }
      this._emit('message', frame)
      this._handleFrame(frame)
    }

    this._ws.onerror = () => {
      this._setStatus('error')
    }

    this._ws.onclose = () => {
      this._stopPing()
      if (!this._manualClose) {
        this._setStatus('disconnected')
        this._scheduleReconnect()
      }
    }
  }

  _handleFrame(frame) {
    switch (frame.type) {
      case 'authenticated':
        // Confirmed – nothing extra needed
        break
      case 'pong':
        break
      case 'notification':
        this._emit('notification', frame.data)
        break
      case 'message':
        if (frame.channel && frame.event) {
          this._emit(`${frame.channel}:${frame.event}`, frame.data)
        }
        break
      case 'error':
        console.warn('[WS] Server error:', frame.message)
        break
    }
  }

  _send(payload) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(payload))
    }
  }

  _emit(event, data) {
    this._listeners[event]?.forEach(fn => {
      try { fn(data) } catch (err) { console.error('[WS] listener error', err) }
    })
  }

  _setStatus(status) {
    this._status = status
    this._emit('status', status)
  }

  _startPing() {
    this._stopPing()
    this._pingTimer = setInterval(() => {
      this._send({ type: 'ping' })
    }, PING_INTERVAL)
  }

  _stopPing() {
    if (this._pingTimer) {
      clearInterval(this._pingTimer)
      this._pingTimer = null
    }
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null
      if (!this._manualClose && this._token) {
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, RECONNECT_MAX_DELAY)
        this._open()
      }
    }, this._reconnectDelay)
  }

  _cleanup() {
    this._stopPing()
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
    if (this._ws) {
      this._ws.onopen    = null
      this._ws.onmessage = null
      this._ws.onerror   = null
      this._ws.onclose   = null
      if (this._ws.readyState < WebSocket.CLOSING) {
        this._ws.close()
      }
      this._ws = null
    }
  }
}

// Singleton – one connection per browser tab
const wsService = new WebSocketService()
export default wsService
