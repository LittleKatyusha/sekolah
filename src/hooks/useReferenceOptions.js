import { useState, useEffect, useMemo } from 'react'
import { referenceService } from '../services/referenceService'

const REFERENCE_OPTIONS_CACHE_PREFIX = 'reference-options-cache:'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const referenceOptionsRequestCache = new Map()

const getReferenceOptionsCacheKey = (category) => `${REFERENCE_OPTIONS_CACHE_PREFIX}${category}`

const readReferenceOptionsCache = (category) => {
  if (!category || typeof window === 'undefined') return null

  try {
    const cached = window.sessionStorage.getItem(getReferenceOptionsCacheKey(category))
    if (!cached) return null

    const parsed = JSON.parse(cached)
    // Support both legacy format (plain array) and new format ({ data, cachedAt })
    if (Array.isArray(parsed)) {
      // Legacy entry without TTL – treat as expired so it gets refreshed
      return null
    }
    if (parsed && Array.isArray(parsed.data)) {
      if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null
      return parsed.data
    }
    return null
  } catch {
    return null
  }
}

const writeReferenceOptionsCache = (category, options) => {
  if (!category || typeof window === 'undefined') return

  try {
    const cacheEntry = { data: options, cachedAt: Date.now() }
    window.sessionStorage.setItem(getReferenceOptionsCacheKey(category), JSON.stringify(cacheEntry))
  } catch {
    // Ignore sessionStorage write failures and rely on in-memory state only.
  }
}

const mapReferenceOptions = (responseData) =>
  (responseData || []).map((item) => ({
    value: item?.kode !== undefined && item?.kode !== null ? String(item.kode) : '',
    label: item?.nama ?? '',
  }))

const serializeFallbackOptions = (fallbackOptions) => {
  try {
    return JSON.stringify(Array.isArray(fallbackOptions) ? fallbackOptions : [])
  } catch {
    return '[]'
  }
}

const deserializeFallbackOptions = (serializedFallbackOptions) => {
  try {
    const parsed = JSON.parse(serializedFallbackOptions)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getReferenceOptionsByCategory = async (category) => {
  const cachedOptions = readReferenceOptionsCache(category)
  if (cachedOptions) {
    return cachedOptions
  }

  let request = referenceOptionsRequestCache.get(category)

  if (!request) {
    request = referenceService.getReferencesByCategory(category)
    referenceOptionsRequestCache.set(category, request)
  }

  try {
    const response = await request
    const mappedOptions = mapReferenceOptions(response.data)
    writeReferenceOptionsCache(category, mappedOptions)
    return mappedOptions
  } finally {
    referenceOptionsRequestCache.delete(category)
  }
}

export function useReferenceOptions(category, fallbackOptions = []) {
  const isArray = Array.isArray(category)
  const categoryKey = isArray ? category.join(',') : category
  const hasCategory = Boolean(category) && (!isArray || category.length > 0)
  const fallbackOptionsKey = useMemo(() => serializeFallbackOptions(fallbackOptions), [fallbackOptions])
  const stableFallbackOptions = useMemo(
    () => deserializeFallbackOptions(fallbackOptionsKey),
    [fallbackOptionsKey]
  )
  const [options, setOptions] = useState(() => (isArray ? {} : stableFallbackOptions))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!hasCategory) {
      setOptions(isArray ? {} : stableFallbackOptions)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const fetchOptions = async () => {
      setLoading(true)
      setError(null)

      try {
        if (isArray) {
          const results = {}
          await Promise.all(
            category.map(async (cat) => {
              results[cat] = await getReferenceOptionsByCategory(cat)
            })
          )
          if (!cancelled) {
            setOptions(results)
          }
        } else {
          const result = await getReferenceOptionsByCategory(category)
          if (!cancelled) {
            setOptions(result)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          if (isArray) {
            setOptions({})
          } else if (stableFallbackOptions.length > 0) {
            setOptions(stableFallbackOptions)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchOptions()

    return () => {
      cancelled = true
    }
  }, [category, categoryKey, hasCategory, isArray, stableFallbackOptions])

  return { options, loading, error }
}

export default useReferenceOptions