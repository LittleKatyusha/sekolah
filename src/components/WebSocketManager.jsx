import { useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import useNotificationStore from '../store/useNotificationStore'
import echoService from '../services/echoService'
import { notifikasiService } from '../features/notifikasi/services/notifikasiService'

// Wait for silent token restoration after reload, while keeping token rotation
// separate from the connection lifecycle so active channels remain subscribed.
export default function WebSocketManager() {
  const { isAuthenticated, token, user } = useAuthStore()
  const { addNotification, clearAll, loadFromApi, setWsStatus } = useNotificationStore()
  const userId = user?.id
  const sessionReady = Boolean(isAuthenticated && token && userId)

  useEffect(() => {
    const offStatus = echoService.on('status', setWsStatus)
    setWsStatus(echoService.status)

    if (!sessionReady) {
      echoService.disconnect()
      clearAll()
      return offStatus
    }

    clearAll()
    const offNotif = echoService.on('notification', addNotification)
    echoService.connect(useAuthStore.getState().token)
    const userChannel = `App.Models.User.${userId}`
    echoService.subscribe(userChannel)

    let cancelled = false
    notifikasiService.getAll({ page: 1, per_page: 20 })
      .then((response) => {
        if (!cancelled && response?.data) {
          loadFromApi(response.data, response.meta?.unread_count ?? 0)
        }
      })
      .catch(() => {
        // Realtime remains available when the initial inbox request fails.
      })

    return () => {
      cancelled = true
      offNotif()
      echoService.unsubscribe(userChannel)
      echoService.disconnect()
      offStatus()
    }
  }, [sessionReady, userId, addNotification, clearAll, loadFromApi, setWsStatus])

  useEffect(() => {
    if (sessionReady) echoService.updateToken(token)
  }, [sessionReady, token])

  return null
}
