import { describe, expect, it } from 'vitest'
import { getTenantFromHostname, resolveApiBaseUrl } from './api'

describe('tenant API base URL', () => {
  it('uses only a valid tenant label in a configured HTTPS pattern', () => {
    expect(resolveApiBaseUrl({
      dev: false,
      hostname: 'smp-1.sekolah.app',
      pattern: 'https://{subdomain}.api.sekolah.app/api/v1/',
    })).toBe('https://smp-1.api.sekolah.app/api/v1')
  })

  it('fails closed for localhost, invalid patterns, and insecure URLs', () => {
    expect(getTenantFromHostname('localhost')).toBeNull()
    expect(resolveApiBaseUrl({ dev: false, hostname: 'localhost', pattern: 'https://{subdomain}.api.sekolah.app/api/v1' })).toBe('/api/v1')
    expect(resolveApiBaseUrl({ dev: false, hostname: 'tenant.sekolah.app', pattern: 'http://{subdomain}.api.sekolah.app/api/v1' })).toBe('/api/v1')
  })
})
