import { AlertTriangle, ShieldAlert } from 'lucide-react'
import Button from '../../../components/ui/Button'

export const ExamViolationModal = ({
  isOpen,
  violationCount,
  maxViolations = 3,
  reason,
  onAcknowledge,
}) => {
  if (!isOpen) return null

  const isLastWarning = violationCount >= maxViolations

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-violation-title"
      aria-describedby="exam-violation-description"
    >
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/40">
            {isLastWarning ? <ShieldAlert size={48} /> : <AlertTriangle size={48} />}
          </div>

          <h2 id="exam-violation-title" className="text-xl font-bold text-gray-900 dark:text-white">
            {isLastWarning ? 'Ujian Dihentikan!' : 'Peringatan Kecurangan!'}
          </h2>

          <p id="exam-violation-description" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Terdeteksi: <span className="font-semibold text-red-600">{reason}</span>
          </p>

          <div className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
            <p className="text-xs text-red-700 dark:text-red-400">
              Pelanggaran ke-{violationCount} dari maksimal {maxViolations} toleransi.
              {isLastWarning
                ? ' Batas toleransi habis. Ujian otomatis dikumpulkan oleh sistem.'
                : ' Pada pelanggaran ke-3, ujian akan otomatis diselesaikan!'}
            </p>
          </div>

          {!isLastWarning && (
            <div className="mt-6 w-full">
              <Button variant="danger" className="w-full" onClick={onAcknowledge} autoFocus>
                Saya Mengerti &amp; Lanjutkan Ujian (Fullscreen)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamViolationModal
