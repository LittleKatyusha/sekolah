import { getTenantFromHostname } from './api'

export const getSubdomain = () => {
  if (typeof window === 'undefined') return null
  const searchParams = new URLSearchParams(window.location.search)
  const param =
    searchParams.get('subdomain') ||
    searchParams.get('tenant') ||
    searchParams.get('sekolah') ||
    searchParams.get('identifier')
  if (param) return param.toLowerCase().trim()

  const tenant = getTenantFromHostname(window.location.hostname)
  if (tenant && tenant !== 'app' && tenant !== 'www') {
    return tenant.toLowerCase().trim()
  }

  return import.meta.env.VITE_DEV_SUBDOMAIN || null
}
