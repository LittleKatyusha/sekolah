export function ImportErrorMessage({ error }) {
  const fields = Object.entries(error.fields ?? {})
  return fields.length ? (
    <ul className="space-y-1">
      {fields.map(([field, messages]) => (
        <li key={field}><strong>{field}</strong>: {[messages].flat().join(' ')}</li>
      ))}
    </ul>
  ) : error.message
}

export default function ImportFeedback({ error, result }) {
  return (
    <>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {result && (
        <div role="status" className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100">
          <p className="font-semibold">
            {result.failed > 0
              ? result.imported > 0 ? 'Import selesai, sebagian data gagal.' : 'Import gagal. Tidak ada data yang berhasil diimport.'
              : result.imported > 0 ? 'Import berhasil.' : 'Tidak ada data yang diimport.'}
          </p>
          <p>{result.imported} berhasil, {result.failed} gagal, {result.skipped ?? 0} dilewati.</p>
          {result.failed > 0 && <p>Perbaiki baris yang gagal, lalu upload ulang hanya data tersebut.</p>}
        </div>
      )}
    </>
  )
}