import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExamAntiCheat } from './useExamAntiCheat'
import { ujianUserService } from '../services/ujianUserService'

vi.mock('../services/ujianUserService', () => ({
  ujianUserService: {
    reportViolation: vi.fn(),
  },
}))

describe('useExamAntiCheat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports TAB_SWITCH when document becomes hidden', async () => {
    ujianUserService.reportViolation.mockResolvedValueOnce({
      data: { data: { violation_count: 1, auto_submitted: false } },
    })

    const { result } = renderHook(() =>
      useExamAntiCheat({ ujianUserId: 123, isActive: true })
    )

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(ujianUserService.reportViolation).toHaveBeenCalledWith(123, 'TAB_SWITCH')
  })

  it('throttles reports within THROTTLE_MS', async () => {
    ujianUserService.reportViolation.mockResolvedValue({
      data: { data: { violation_count: 1, auto_submitted: false } },
    })

    renderHook(() => useExamAntiCheat({ ujianUserId: 123, isActive: true }))

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(ujianUserService.reportViolation).toHaveBeenCalledTimes(1)

    // Fire immediately again
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(ujianUserService.reportViolation).toHaveBeenCalledTimes(1)

    // Advance time beyond 3000ms
    act(() => {
      vi.advanceTimersByTime(3100)
    })

    await act(async () => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(ujianUserService.reportViolation).toHaveBeenCalledTimes(2)
  })

  it('triggers onAutoSubmitted and exits fullscreen when auto_submitted is true', async () => {
    const onAutoSubmitted = vi.fn()
    ujianUserService.reportViolation.mockResolvedValueOnce({
      data: { data: { violation_count: 3, auto_submitted: true } },
    })

    renderHook(() =>
      useExamAntiCheat({
        ujianUserId: 123,
        isActive: true,
        onAutoSubmitted,
      })
    )

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(onAutoSubmitted).toHaveBeenCalled()
  })
})
