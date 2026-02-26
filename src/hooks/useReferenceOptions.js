import { useState, useEffect } from 'react'
import { referenceService } from '../services/referenceService'

export function useReferenceOptions(category, fallbackOptions = []) {
  const isArray = Array.isArray(category)
  const [options, setOptions] = useState(isArray ? {} : fallbackOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!category || (isArray && category.length === 0)) return

    const fetchOptions = async () => {
      setLoading(true)
      setError(null)
      try {
        if (isArray) {
          const results = {}
          await Promise.all(
            category.map(async (cat) => {
              const response = await referenceService.getReferencesByCategory(cat)
              results[cat] = (response.data || []).map((item) => ({
                value: item.kode,
                label: item.nama,
              }))
            })
          )
          setOptions(results)
        } else {
          const response = await referenceService.getReferencesByCategory(category)
          setOptions(
            (response.data || []).map((item) => ({
              value: item.kode,
              label: item.nama,
            }))
          )
        }
      } catch (err) {
        setError(err)
        if (!isArray && fallbackOptions.length > 0) {
          setOptions(fallbackOptions)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [isArray ? category.join(',') : category])

  return { options, loading, error }
}

export default useReferenceOptions