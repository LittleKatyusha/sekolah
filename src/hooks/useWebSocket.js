import { useEffect, useRef, useCallback } from 'react'
import echoService from '../services/echoService'
import useNotificationStore from '../store/useNotificationStore'

/**
 * Subscribe to a Laravel Echo channel and listen for specific events.
 *
 * @param {string|null} channel
 *   Backend channel name, e.g. "forum.42" or "notifications".
 *   Pass null/undefined to skip channel subscription (listener-only mode).
 *
 * @param {Record<string, (data: any) => void>} eventHandlers
 *   Map of event name → callback.
 *   e.g. { "new-reply": (data) => console.log(data) }
 *   Use "*" as key to receive every raw message frame from the server.
 *
 * @returns {{ status: string, send: (type: string, payload?: object) => void }}
 */
export function useWebSocket(channel, eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers)
  const wsStatus    = useNotificationStore(s => s.wsStatus)

  // Keep the handlers ref up-to-date without re-running the effect
  useEffect(() => {
    handlersRef.current = eventHandlers
  })

  useEffect(() => {
    if (!channel && Object.keys(eventHandlers).length === 0) return

    // Subscribe to the backend channel via Echo
    if (channel) echoService.subscribe(channel)

    // Register per-channel event listeners
    const unsubs = Object.keys(handlersRef.current).map(event => {
      const fullEvent = event === '*'
        ? 'message'
        : channel
          ? `${channel}:${event}`
          : event
      return echoService.on(fullEvent, (data) => {
        handlersRef.current[event]?.(data)
      })
    })

    return () => {
      unsubs.forEach(fn => fn())
      if (channel) echoService.unsubscribe(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  // send is a no-op shim kept for API compatibility;
  // with Echo you listen to server broadcasts rather than sending raw frames.
  const send = useCallback((_type, _payload = {}) => {
    console.warn('[Echo] useWebSocket.send() is not supported with Laravel Echo')
  }, [])

  return { status: wsStatus, send }
}

export default useWebSocket
