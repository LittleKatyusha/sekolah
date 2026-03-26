import { create } from 'zustand'

const COMPLETE_DELAY_MS = 180
const NO_REQUEST_GRACE_MS = 400

let completionTimer = null
let graceTimer = null

const clearCompletionTimer = () => {
  if (completionTimer) {
    window.clearTimeout(completionTimer)
    completionTimer = null
  }
}

const clearGraceTimer = () => {
  if (graceTimer) {
    window.clearTimeout(graceTimer)
    graceTimer = null
  }
}

const clearTimers = () => {
  clearCompletionTimer()
  clearGraceTimer()
}

const finalizeProgress = () => {
  clearTimers()

  const store = useNavigationProgressStore.getState()
  if (!store.isVisible) return

  useNavigationProgressStore.setState({
    progress: 100,
    pendingNavigation: false,
    routeReady: false,
    requestObserved: false,
  })

  completionTimer = window.setTimeout(() => {
    useNavigationProgressStore.setState({
      isVisible: false,
      progress: 0,
    })
    completionTimer = null
  }, COMPLETE_DELAY_MS)
}

const scheduleCompletionCheck = () => {
  clearGraceTimer()

  graceTimer = window.setTimeout(() => {
    const { activeRequests, pendingNavigation, routeReady } = useNavigationProgressStore.getState()

    if (pendingNavigation && routeReady && activeRequests === 0) {
      finalizeProgress()
    }

    graceTimer = null
  }, NO_REQUEST_GRACE_MS)
}

const useNavigationProgressStore = create((set, get) => ({
  isVisible: false,
  progress: 0,
  activeRequests: 0,
  pendingNavigation: false,
  routeReady: false,
  requestObserved: false,

  setProgress: (value) => {
    set((state) => ({
      progress: Math.min(95, Math.max(state.progress, value)),
    }))
  },

  startNavigation: () => {
    clearTimers()

    set((state) => ({
      isVisible: true,
      progress: Math.max(state.progress, 18),
      pendingNavigation: true,
      routeReady: false,
      requestObserved: false,
    }))
  },

  markRouteReady: () => {
    const { pendingNavigation, activeRequests } = get()
    if (!pendingNavigation) return

    set((state) => ({
      routeReady: true,
      progress: Math.max(state.progress, activeRequests > 0 ? 62 : 32),
    }))

    if (activeRequests === 0) {
      scheduleCompletionCheck()
    }
  },

  beginRequest: () => {
    clearGraceTimer()

    set((state) => {
      const shouldSurface = state.pendingNavigation || state.isVisible

      return {
        activeRequests: state.activeRequests + 1,
        requestObserved: shouldSurface ? true : state.requestObserved,
        isVisible: shouldSurface ? true : state.isVisible,
        progress: shouldSurface
          ? Math.max(state.progress, state.routeReady ? 62 : 42)
          : state.progress,
      }
    })
  },

  endRequest: () => {
    const { activeRequests } = get()
    if (activeRequests === 0) return

    set((state) => {
      const nextActiveRequests = Math.max(0, state.activeRequests - 1)

      return {
        activeRequests: nextActiveRequests,
        progress: nextActiveRequests === 0
          ? Math.max(state.progress, 88)
          : Math.max(state.progress, 72),
      }
    })

    const nextState = get()
    if (nextState.pendingNavigation && nextState.routeReady && nextState.activeRequests === 0) {
      finalizeProgress()
    }
  },

  cancelNavigation: () => {
    clearTimers()

    set({
      isVisible: false,
      progress: 0,
      pendingNavigation: false,
      routeReady: false,
      requestObserved: false,
    })
  },
}))

export default useNavigationProgressStore