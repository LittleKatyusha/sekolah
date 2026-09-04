const RELOAD_KEY = 'vite-preload-reload-at'
const RELOAD_COOLDOWN_MS = 10_000

export const recoverFromStaleChunk = (event, options = {}) => {
  const storage = options.storage || window.sessionStorage
  const reload = options.reload || (() => window.location.reload())
  const now = options.now || Date.now()

  event.preventDefault()

  const lastReload = Number(storage.getItem(RELOAD_KEY) || 0)
  if (lastReload && now - lastReload < RELOAD_COOLDOWN_MS) return false

  storage.setItem(RELOAD_KEY, String(now))
  reload()
  return true
}