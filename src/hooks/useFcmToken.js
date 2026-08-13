import { useEffect, useRef } from 'react'
import { getToken, deleteToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '../firebase'
import { registerFcmToken, deleteFcmToken } from '../services/fcmService'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Manages the FCM device-token lifecycle:
 *   • On mount (authenticated): request permission → get FCM token → register with backend.
 *   • On unmount (logout / auth change): revoke token from Firebase + delete from backend.
 *
 * Must only be mounted when the user is authenticated.
 */
export function useFcmToken() {
  const messagingRef = useRef(null)
  const registeredTokenRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const register = async () => {
      // Firefox / browsers without push support will return null here.
      const messaging = await getFirebaseMessaging()
      if (!messaging || cancelled) return

      messagingRef.current = messaging

      // Request notification permission if not yet granted.
      const permission = await Notification.requestPermission()
      if (permission !== 'granted' || cancelled) return

      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/' }
          ),
        })

        if (!token || cancelled) return

        registeredTokenRef.current = token
        await registerFcmToken(token)
      } catch (err) {
        // Non-fatal: FCM is supplementary to WebSocket notifications.
        console.warn('[FCM] Token registration failed:', err?.message ?? err)
      }
    }

    register()

    return () => {
      cancelled = true

      const cleanup = async () => {
        if (!registeredTokenRef.current || !messagingRef.current) return

        try {
          await deleteToken(messagingRef.current)
        } catch {
          // Ignore — token may already be invalidated.
        }

        try {
          await deleteFcmToken()
        } catch {
          // Ignore — user may have already been logged out.
        }

        registeredTokenRef.current = null
      }

      cleanup()
    }
  // Run once on mount; the parent (FcmManager) only mounts when authenticated.
  }, [])
}
