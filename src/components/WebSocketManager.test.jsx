import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WebSocketManager from './WebSocketManager'
import useAuthStore from '../store/useAuthStore'
import useNotificationStore from '../store/useNotificationStore'
import echoService from '../services/echoService'

vi.mock('../services/echoService', () => {
  const listeners = new Map()
  const service = {
    status: 'disconnected',
    on: vi.fn((event, fn) => {
      listeners.set(event, fn)
      return () => listeners.delete(event)
    }),
    connect: vi.fn(() => {
      service.status = 'connecting'
      listeners.get('status')?.('connecting')
    }),
    disconnect: vi.fn(() => {
      service.status = 'disconnected'
      listeners.get('status')?.('disconnected')
    }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    updateToken: vi.fn(),
  }
  return { default: service }
})

beforeEach(() => {
  vi.clearAllMocks()
  echoService.status = 'disconnected'
  useAuthStore.setState({ isAuthenticated: true, token: null, user: { id: 42 } })
  useNotificationStore.setState({ wsStatus: 'disconnected' })
})
afterEach(cleanup)

describe('WebSocket session lifecycle', () => {
  it('connects when the access token is restored after reload', () => {
    render(<WebSocketManager />)
    expect(echoService.connect).not.toHaveBeenCalled()

    act(() => useAuthStore.setState({ token: 'restored-token' }))

    expect(echoService.connect).toHaveBeenCalledWith('restored-token')
    expect(echoService.subscribe).toHaveBeenCalledWith('App.Models.User.42')
    expect(useNotificationStore.getState().wsStatus).toBe('connecting')
  })

  it('rotates tokens without disconnecting and disconnects on logout', () => {
    useAuthStore.setState({ token: 'first-token' })
    render(<WebSocketManager />)
    act(() => useAuthStore.setState({ token: 'renewed-token' }))

    expect(echoService.connect).toHaveBeenCalledTimes(1)
    expect(echoService.disconnect).not.toHaveBeenCalled()
    expect(echoService.updateToken).toHaveBeenLastCalledWith('renewed-token')

    act(() => useAuthStore.getState().logout())
    expect(echoService.unsubscribe).toHaveBeenCalledWith('App.Models.User.42')
    expect(echoService.disconnect).toHaveBeenCalled()
    expect(useNotificationStore.getState().wsStatus).toBe('disconnected')
  })

  it('waits for the user and switches subscriptions when the user changes', () => {
    useAuthStore.setState({ token: 'restored-token', user: null })
    render(<WebSocketManager />)
    expect(echoService.connect).not.toHaveBeenCalled()

    act(() => useAuthStore.setState({ user: { id: 42 } }))
    expect(echoService.subscribe).toHaveBeenCalledWith('App.Models.User.42')
    act(() => useAuthStore.setState({ user: { id: 43 } }))
    expect(echoService.unsubscribe).toHaveBeenCalledWith('App.Models.User.42')
    expect(echoService.subscribe).toHaveBeenLastCalledWith('App.Models.User.43')
  })
})
