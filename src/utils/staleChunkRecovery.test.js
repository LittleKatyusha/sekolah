import { describe, expect, it, vi } from 'vitest'
import { recoverFromStaleChunk } from './staleChunkRecovery'

describe('recoverFromStaleChunk', () => {
  it('reloads once when a deployed chunk is stale', () => {
    const event = { preventDefault: vi.fn() }
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() }
    const reload = vi.fn()

    expect(recoverFromStaleChunk(event, { storage, reload, now: 20_000 })).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(storage.setItem).toHaveBeenCalledWith('vite-preload-reload-at', '20000')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('does not loop when the chunk still cannot load', () => {
    const storage = { getItem: vi.fn(() => '15000'), setItem: vi.fn() }
    const reload = vi.fn()

    expect(recoverFromStaleChunk({ preventDefault: vi.fn() }, { storage, reload, now: 20_000 })).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})