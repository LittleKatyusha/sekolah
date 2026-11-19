import { useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import useNotificationStore from '../store/useNotificationStore'
import echoService from '../services/echoService'

// Wait for silent token restoration after reload, while keeping token rotation
// separate from the connection lifecycle so active channels remain subscribed.
export default function WebSocketManager() {
  const { isAuthenticated, token, user } = useAuthStore()
  const { addNotification, setWsStatus } = useNotificationStore()
  const userId = user?.id
  const sessionReady = Boolean(isAuthenticated && token && userId)

  useEffect(() => {
    const offStatus = echoService.on('status', setWsStatus)
    setWsStatus(echoService.status)

    if (!sessionReady) {
      echoService.disconnect()
      return offStatus
    }

    const offNotif = echoService.on('notification', addNotification)
    echoService.connect(useAuthStore.getState().token)
    const userChannel = `App.Models.User.${userId}`
    echoService.subscribe(userChannel)

    return () => {
      offNotif()
      echoService.unsubscribe(userChannel)
      echoService.disconnect()
      offStatus()
    }
  }, [sessionReady, userId, addNotification, setWsStatus])

  useEffect(() => {
    if (sessionReady) echoService.updateToken(token)
  }, [sessionReady, token])

  return null
}
