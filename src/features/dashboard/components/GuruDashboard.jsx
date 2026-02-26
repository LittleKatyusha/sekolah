import React from 'react'
import { Users, BookOpen, GraduationCap, ClipboardCheck, AlertTriangle } from 'lucide-react'
import StatCard from './StatCard'
import QuickActions from './QuickActions'
import Card from '../../../components/ui/Card'

const GuruDashboard = ({ data }) => {
  const { profile, summary, recent_bk_cases } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Selamat Datang, {profile?.nama || 'Guru'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          NIP: {profile?.nip || '-'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Siswa Perwalian"
          value={summary?.total_siswa_wali || 0}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Mata Pelajaran"
          value={summary?.total_mata_pelajaran || 0}
          icon={BookOpen}
          color="text-green-600"
        />
        <StatCard
          title="Kelas Wali"
          value={summary?.total_kelas_wali || 0}
          icon={GraduationCap}
          color="text-purple-600"
        />
        <StatCard
          title="Tugas Belum Dinilai"
          value={summary?.tugas_belum_dinilai || 0}
          icon={ClipboardCheck}
          color="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Kasus BK Terbaru">
          <div className="space-y-3">
            {(!recent_bk_cases || recent_bk_cases.length === 0) ? (
              <p className="text-gray-500 text-sm">Tidak ada kasus BK terbaru.</p>
            ) : (
              recent_bk_cases.map((kasus) => (
                <div key={kasus.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 dark:border-gray-700">
                  <div className="p-2 bg-red-50 text-red-600 rounded-full dark:bg-red-900/30">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {kasus.siswa?.nama || 'Siswa'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {kasus.deskripsi || kasus.judul || 'Kasus BK'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <QuickActions role="guru" />
      </div>
    </div>
  )
}

export default GuruDashboard