import { useCallback, useRef, useEffect } from 'react'
import useNotificationStore from '../../../store/useNotificationStore'

/**
 * Custom hook for forum WebSocket integration
 * @param {string|null} topicId - Topic ID to subscribe to
 * @param {Object} handlers - Event handlers
 * @returns {{ isLive: boolean, typingUsers: Array }}
 */
export function useForumWebSocket(topicId, handlers = {}) {
  const wsStatus = useNotificationStore(s => s.wsStatus)
  const typingUsersRef = useRef(new Map())

  // Check if WebSocket is connected
  const isLive = wsStatus === 'connected'

  // Handle new reply event
  const handleNewReply = useCallback((data) => {
    handlers.onNewReply?.(data)
  }, [handlers])

  // Handle reply deleted event
  const handleReplyDeleted = useCallback((data) => {
    handlers.onReplyDeleted?.(data)
  }, [handlers])

  // Handle user typing event
  const handleUserTyping = useCallback((data) => {
    if (data.userId && data.userName) {
      typingUsersRef.current.set(data.userId, {
        name: data.userName,
        timestamp: Date.now()
      })
      handlers.onUserTyping?.(Array.from(typingUsersRef.current.values()))
    }
  }, [handlers])

  // Cleanup old typing indicators (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      typingUsersRef.current.forEach((value, key) => {
        if (now - value.timestamp > 5000) {
          typingUsersRef.current.delete(key)
        }
      })
      handlers.onUserTyping?.(Array.from(typingUsersRef.current.values()))
    }, 1000)

    return () => clearInterval(interval)
  }, [handlers])

  // Subscribe to WebSocket channel if available
  useEffect(() => {
    if (!topicId || !isLive) return

    // Note: The actual WebSocket subscription is handled by the existing
    // websocketService.js and useWebSocket.js hooks
    // This hook provides a cleaner interface for forum-specific events
    handlers.onConnected?.()

    return () => {
      handlers.onDisconnected?.()
    }
  }, [topicId, isLive, handlers])

  return {
    isLive,
    typingUsers: Array.from(typingUsersRef.current.values())
  }
}

export default useForumWebSocket
