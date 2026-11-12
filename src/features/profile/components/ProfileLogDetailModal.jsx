import { useState } from 'react'
import { X, Copy, Check, History, Clock, Layers, Globe, Laptop } from 'lucide-react'
import ActionBadge from '../../activity-logs/components/ActionBadge'

const formatDateTime = (val) => (!val ? '-' : new Date(val).toLocaleString('id-ID', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}))

export default function ProfileLogDetailModal({ log, onClose, formatModuleName }) {
  const [copied, setCopied] = useState(false)
  if (!log) return null

  const handleCopy = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const props = log.properties
  const hasProps = props && Object.keys(props).length > 0
  const isDiff = hasProps && props.old && props.new

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Detail Log #{log.id}</h3>
              <p className="text-xs text-gray-400">Rincian aktivitas & rekam jejak audit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5"><Clock size={12} /> Waktu</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(log.created_at)}</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5"><Layers size={12} /> Aksi & Modul</span>
              <div className="flex items-center gap-2 pt-0.5">
                <ActionBadge action={log.event || log.log_name} />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {formatModuleName(log.log_name, log.subject_type)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Deskripsi</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              {log.description || '-'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Target Model:</span>
              <p className="font-mono text-gray-700 dark:text-gray-300 break-all mt-0.5">{log.subject_type || '-'}</p>
            </div>
            <div>
              <span className="text-gray-400">ID Target:</span>
              <p className="font-mono text-gray-700 dark:text-gray-300 mt-0.5">{log.subject_id ?? '-'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-2 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-gray-400">Jaringan & Klien</h4>
            <div className="flex items-start gap-2">
              <Globe size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <span>IP: <strong className="font-mono text-gray-800 dark:text-gray-200">{log.ip_address || '-'}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <Laptop size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <span className="break-all text-gray-600 dark:text-gray-300">UA: {log.user_agent || '-'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Properties</label>
              {hasProps && (
                <button
                  type="button"
                  onClick={() => handleCopy(props)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                </button>
              )}
            </div>
            {hasProps ? (
              isDiff ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
                    <span className="font-semibold text-red-600 dark:text-red-400 block mb-1">Old</span>
                    <pre className="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(props.old, null, 2)}
                    </pre>
                  </div>
                  <div className="p-3 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/20">
                    <span className="font-semibold text-green-600 dark:text-green-400 block mb-1">New</span>
                    <pre className="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(props.new, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <pre className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto">
                  {JSON.stringify(props, null, 2)}
                </pre>
              )
            ) : (
              <p className="text-xs text-gray-400 italic p-3 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700">
                Tidak ada perubahan data spesifik.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
