import { ServerOff } from 'lucide-react'

const BackendUnavailable = () => (
  <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
    <ServerOff className="h-12 w-12 text-amber-500" aria-hidden="true" />
    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Modul belum tersedia</h1>
    <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
      Backend belum menyediakan API untuk modul ini. Akses dinonaktifkan agar aplikasi tidak mengirim permintaan yang pasti gagal.
    </p>
  </div>
)

export default BackendUnavailable
