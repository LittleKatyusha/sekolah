import { describe, expect, it } from 'vitest'
import { getTenantFromHostname, resolveApiBaseUrl, isTransientError, sanitizeApiError } from './api'

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

describe('transient error detection and retry', () => {
  it('identifies network failures without response as transient', () => {
    expect(isTransientError({ message: 'Network Error' })).toBe(true)
  })

  it('identifies database bad connection errors as transient', () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'driver: bad connection' },
      },
      config: { method: 'get' },
    }
    expect(isTransientError(error)).toBe(true)
  })

  it('identifies 502/503/504 as transient', () => {
    expect(isTransientError({ response: { status: 502 } })).toBe(true)
    expect(isTransientError({ response: { status: 503 } })).toBe(true)
    expect(isTransientError({ response: { status: 504 } })).toBe(true)
  })

  it('identifies idempotent GET 500 errors as transient', () => {
    const error = {
      response: { status: 500, data: { message: 'Internal Server Error' } },
      config: { method: 'get' },
    }
    expect(isTransientError(error)).toBe(true)
  })

  it('does not treat client 4xx errors as transient', () => {
    expect(isTransientError({ response: { status: 400 } })).toBe(false)
    expect(isTransientError({ response: { status: 401 } })).toBe(false)
    expect(isTransientError({ response: { status: 404 } })).toBe(false)
    expect(isTransientError({ response: { status: 422 } })).toBe(false)
  })
})

describe('error message sanitization', () => {
  it('masks raw "driver: bad connection" messages', () => {
    const sanitized = sanitizeApiError({
      response: {
        status: 500,
        data: { message: 'sql: driver: bad connection' },
      },
    })
    expect(sanitized.message).not.toContain('driver: bad connection')
    expect(sanitized.message).toBe('Koneksi ke server terputus. Silakan coba beberapa saat lagi.')
  })

  it('preserves user-facing validation errors', () => {
    const sanitized = sanitizeApiError({
      response: {
        status: 400,
        data: { message: 'Nama kelas wajib diisi' },
      },
    })
    expect(sanitized.message).toBe('Nama kelas wajib diisi')
  })
})
