import { describe, expect, it } from 'vitest'
import { resolveBroadcastAuthEndpoint, resolveTenantValue } from './echoService'

describe('Echo tenant configuration', () => {
  it('resolves tenant placeholders and keeps auth on the tenant API host', () => {
    expect(resolveTenantValue('{subdomain}.reverb.sekolah.app', 'smp-1.sekolah.app')).toBe('smp-1.reverb.sekolah.app')
    expect(resolveBroadcastAuthEndpoint({
      VITE_API_BASE_URL_PATTERN: 'https://{subdomain}.api.sekolah.app/api/v1',
    }, 'smp-1.sekolah.app')).toBe('https://smp-1.api.sekolah.app/api/broadcasting/auth')
  })

  it('does not produce a frontend-relative endpoint without an absolute API URL', () => {
    expect(resolveBroadcastAuthEndpoint({ VITE_API_BASE_URL: '/api/v1' }, 'smp-1.sekolah.app')).toBeNull()
  })
})
