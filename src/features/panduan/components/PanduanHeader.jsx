import { Link } from 'react-router-dom'
import { BookOpen, Printer, LifeBuoy } from 'lucide-react'
import Button from '../../../components/ui/Button'

export default function PanduanHeader() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-primary-800 text-white p-6 sm:p-8 shadow-lg">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pusat Panduan Resmi AkademiHub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Petunjuk Penggunaan Aplikasi
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Panduan terperinci alur kerja seluruh modul untuk pengguna Web Dashboard,
            Aplikasi Mobile (Android & iOS), Android TV Signage, dan Integrasi IoT RFID.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md font-medium">
              15 Modul Lengkap
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md font-medium">
              Web & Mobile Ready
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md font-medium">
              Solusi Masalah Cepat
            </span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 hover:bg-gray-100 shadow-sm border-0 text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </Button>
          <Link to="/support/tickets">
            <Button
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 shadow-sm border-0 text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Tiket Bantuan</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
