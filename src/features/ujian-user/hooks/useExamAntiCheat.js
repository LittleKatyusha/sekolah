import { useEffect, useRef, useState, useCallback } from 'react'
import { ujianUserService } from '../services/ujianUserService'

const THROTTLE_MS = 3000 // 3 seconds cooldown per report to handle spikes

export const useExamAntiCheat = ({
  ujianUserId,
  isActive = true,
  maxViolations = 3,
  onAutoSubmitted,
}) => {
  const [violationCount, setViolationCount] = useState(0)
  const [lastViolationReason, setLastViolationReason] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const inFlightRef = useRef(false)
  const lastReportTimeRef = useRef(0)
  const isTerminatedRef = useRef(false)

  const requestFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement
      if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen()
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen()
        }
      }
      setIsFullscreen(true)
    } catch {
      // User gesture required / ignored
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
    } catch {
      // Ignored
    }
  }, [])

  const triggerViolation = useCallback(async (type, reasonLabel) => {
    if (!isActive || !ujianUserId || inFlightRef.current || isTerminatedRef.current) {
      return
    }

    const now = Date.now()
    if (now - lastReportTimeRef.current < THROTTLE_MS) {
      return
    }

    inFlightRef.current = true
    lastReportTimeRef.current = now

    try {
      const response = await ujianUserService.reportViolation(ujianUserId, type)
      if (response?.data?.data) {
        const { violation_count, auto_submitted } = response.data.data
        setViolationCount(violation_count)
        setLastViolationReason(reasonLabel)
        setShowWarningModal(true)

        if (auto_submitted) {
          isTerminatedRef.current = true
          await exitFullscreen()
          if (onAutoSubmitted) onAutoSubmitted()
        }
      }
    } catch (err) {
      console.error('Telemetry report dropped:', err)
    } finally {
      inFlightRef.current = false
    }
  }, [isActive, ujianUserId, exitFullscreen, onAutoSubmitted])

  useEffect(() => {
    if (!isActive) return

    // 1. Tab & Window Blur Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH', 'Membuka tab atau aplikasi lain')
      }
    }

    const handleWindowBlur = () => {
      triggerViolation('APP_BLUR', 'Kehilangan fokus layar ujian')
    }

    // 2. Fullscreen Listener
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement || document.webkitFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
      if (!isCurrentlyFullscreen && !isTerminatedRef.current) {
        triggerViolation('EXIT_FULLSCREEN', 'Keluar dari mode Layar Penuh (Fullscreen)')
      }
    }

    // 3. Lightweight Keyboard & DevTools Blocker
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault()
        triggerViolation('DEVTOOLS_OPEN', 'Mencoba membuka Developer Tools / Source Code')
      }
    }

    // 4. Clipboard Protection
    const onCopy = (e) => {
      e.preventDefault()
      triggerViolation('CLIPBOARD_VIOLATION', 'Mencoba menyalin (copy) teks')
    }
    const onCut = (e) => {
      e.preventDefault()
      triggerViolation('CLIPBOARD_VIOLATION', 'Mencoba memotong (cut) teks')
    }
    const onPaste = (e) => {
      e.preventDefault()
      triggerViolation('CLIPBOARD_VIOLATION', 'Mencoba menempelkan (paste) teks')
    }
    const onContextMenu = (e) => e.preventDefault()

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })
    window.addEventListener('blur', handleWindowBlur, { passive: true })
    document.addEventListener('fullscreenchange', handleFullscreenChange, { passive: true })
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('copy', onCopy)
    window.addEventListener('cut', onCut)
    window.addEventListener('paste', onPaste)
    window.addEventListener('contextmenu', onContextMenu)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('copy', onCopy)
      window.removeEventListener('cut', onCut)
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [isActive, triggerViolation])

  const acknowledgeWarning = () => {
    setShowWarningModal(false)
    if (!isFullscreen) {
      requestFullscreen()
    }
  }

  return {
    isFullscreen,
    violationCount,
    lastViolationReason,
    showWarningModal,
    requestFullscreen,
    exitFullscreen,
    acknowledgeWarning,
  }
}
