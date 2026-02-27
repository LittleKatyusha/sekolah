import { useEffect, useRef, useCallback } from 'react'
import wsService from '../services/websocketService'
import useNotificationStore from '../store/useNotificationStore'

/**
 * useWebSocket
 *
 * Subscribe to a WebSocket channel and listen for specific events.
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

    // Subscribe to the backend channel
    if (channel) wsService.subscribe(channel)

    // Register per-channel event listeners
    const unsubs = Object.keys(handlersRef.current).map(event => {
      const fullEvent = event === '*'
        ? 'message'
        : channel
          ? `${channel}:${event}`
          : event
      return wsService.on(fullEvent, (data) => {
        handlersRef.current[event]?.(data)
      })
    })

    return () => {
      unsubs.forEach(fn => fn())
      if (channel) wsService.unsubscribe(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  const send = useCallback((type, payload = {}) => {
    wsService._send({ type, channel, ...payload })
  }, [channel])

  return { status: wsStatus, send }
}

export default useWebSocket
