import { useRef, useState } from 'react'

const UNKNOWN_RESULT = 'Hasil import belum dapat dipastikan. Refresh data sebelum mengunggah ulang.'

export default function useFileImport(file, upload, onSuccess) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  const handleSubmit = async () => {
    if (!file || submitting.current) return
    submitting.current = true
    setLoading(true)
    setError('')
    let response
    try {
      response = await upload(file)
    } catch {
      setError(UNKNOWN_RESULT)
      return
    } finally {
      submitting.current = false
      setLoading(false)
    }

    const uploadError = response?.error
    if (uploadError) {
      if (typeof uploadError === 'string' || uploadError.status >= 500) {
        setError(UNKNOWN_RESULT)
      } else {
        const details = Object.values(uploadError.errors ?? {}).flat()
          .map((detail) => typeof detail === 'string' ? detail : detail.message)
          .filter(Boolean)
        setError([...new Set([uploadError.message || 'Gagal mengimpor file.', ...details])].join(' '))
      }
      return
    }

    const summary = response?.data?.data ?? response?.data
    if (!Number.isInteger(summary?.imported) || !Number.isInteger(summary?.failed)) {
      setError(UNKNOWN_RESULT)
      return
    }
    setResult(summary)
    if (summary.imported > 0) onSuccess?.(summary)
  }

  return { loading, result, setResult, error, setError, handleSubmit }
}