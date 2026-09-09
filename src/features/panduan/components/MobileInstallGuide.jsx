import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import Card from '../../../components/ui/Card'

const STEPS = {
  android: [
    { no: 1, title: 'Buka di Chrome', desc: 'Akses web AkademiHub di Chrome Android.' },
    { no: 2, title: 'Install Aplikasi', desc: 'Ketuk menu titik tiga (⋮) > Tambahkan ke Layar Utama.' },
    { no: 3, title: 'Buka & Login', desc: 'Ikon siap di layar HP. Login dengan NISN atau NIP.' },
  ],
  ios: [
    { no: 1, title: 'Buka di Safari', desc: 'Akses web sekolah di browser Safari iPhone.' },
    { no: 2, title: 'Ketuk Bagikan', desc: 'Ketuk tombol Share (kotak panah ke atas) di bawah.' },
    { no: 3, title: 'Add to Home Screen', desc: 'Pilih "Tambahkan ke Layar Utama" > ketuk Tambah.' },
  ],
}

export default function MobileInstallGuide() {
  const [tab, setTab] = useState('android')
  const steps = STEPS[tab]

  return (
    <Card className="border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Pasang Aplikasi di Smartphone
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                PWA Ringan
              </span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Akses cepat tanpa boros kuota untuk Siswa, Wali Murid, dan Guru.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-indigo-200 dark:border-indigo-800 p-0.5 bg-white dark:bg-gray-800 shrink-0">
          <button
            onClick={() => setTab('android')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              tab === 'android'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600'
            }`}
          >
            Android (Chrome)
          </button>
          <button
            onClick={() => setTab('ios')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              tab === 'ios'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600'
            }`}
          >
            iOS (Safari)
          </button>
        </div>
      </div>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
        {steps.map((s) => (
          <div key={s.no} className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
              {s.no}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{s.title}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
