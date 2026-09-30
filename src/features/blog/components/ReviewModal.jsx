import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export const ReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  artikel,
  initialAction = 'approve',
  loading = false,
}) => {
  const [action, setAction] = useState(initialAction)
  const [rejectionNote, setRejectionNote] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setAction(initialAction)
    setRejectionNote('')
    setValidationError('')
  }, [isOpen, initialAction])

  if (!isOpen || !artikel) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (action === 'reject') {
      if (!rejectionNote.trim() || rejectionNote.trim().length < 5) {
        setValidationError('Catatan penolakan wajib diisi minimal 5 karakter.')
        return
      }
    }
    setValidationError('')
    onSubmit({
      action,
      artikelId: artikel.id,
      rejectionNote: action === 'reject' ? rejectionNote.trim() : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Artikel</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Judul Artikel</span>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mt-0.5">
              {artikel.judul}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Penulis: <span className="font-medium text-gray-700 dark:text-gray-300">{artikel.author_name}</span>
            </p>
          </div>

          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-900 p-1 gap-1">
            <button
              type="button"
              onClick={() => { setAction('approve'); setValidationError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
                action === 'approve'
                  ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Setujui & Terbitkan
            </button>
            <button
              type="button"
              onClick={() => { setAction('reject'); setValidationError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
                action === 'reject'
                  ? 'bg-white dark:bg-gray-800 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Tolak
            </button>
          </div>

          {action === 'approve' ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm">
              Artikel ini akan segera diterbitkan dan dapat dibaca oleh publik di portal sekolah.
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="rejection_note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alasan Penolakan / Catatan Revisi <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="rejection_note"
                rows={4}
                required
                value={rejectionNote}
                onChange={(e) => {
                  setRejectionNote(e.target.value)
                  if (validationError) setValidationError('')
                }}
                placeholder="Tuliskan catatan perbaikan atau alasan penolakan secara jelas (min. 5 karakter)..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-gray-100 ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-500'
                    : 'border-gray-300 focus:border-rose-500 dark:border-gray-700'
                }`}
              />
              {validationError && <p className="text-xs text-rose-600 dark:text-rose-400">{validationError}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? 'Memproses...' : action === 'approve' ? 'Ya, Terbitkan Artikel' : 'Tolak Artikel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewModal
