import { useState, useEffect } from 'react'
import { referenceService } from '../services/referenceService'

const REFERENCE_OPTIONS_CACHE_PREFIX = 'reference-options-cache:'
const referenceOptionsRequestCache = new Map()

const getReferenceOptionsCacheKey = (category) => `${REFERENCE_OPTIONS_CACHE_PREFIX}${category}`

const readReferenceOptionsCache = (category) => {
  if (!category || typeof window === 'undefined') return null

  try {
    const cached = window.sessionStorage.getItem(getReferenceOptionsCacheKey(category))
    if (!cached) return null

    const parsed = JSON.parse(cached)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeReferenceOptionsCache = (category, options) => {
  if (!category || typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(getReferenceOptionsCacheKey(category), JSON.stringify(options))
  } catch {
    // Ignore sessionStorage write failures and rely on in-memory state only.
  }
}

const mapReferenceOptions = (responseData) =>
  (responseData || []).map((item) => ({
    value: item.kode,
    label: item.nama,
  }))

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
  const [options, setOptions] = useState(isArray ? {} : fallbackOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!hasCategory) return

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
          setOptions(results)
        } else {
          const result = await getReferenceOptionsByCategory(category)
          setOptions(result)
        }
      } catch (err) {
        setError(err)
        if (isArray) {
          setOptions({})
        } else if (fallbackOptions.length > 0) {
          setOptions(fallbackOptions)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [category, categoryKey, fallbackOptions, hasCategory, isArray])

  return { options, loading, error }
}

export default useReferenceOptions