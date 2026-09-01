import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, DollarSign, Calendar, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'

const quickActionsByRole = {
  admin: [
    { label: 'Kelola Siswa', icon: Users, path: '/siswa', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Kelola Guru', icon: BookOpen, path: '/guru', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Kelola Kelas', icon: GraduationCap, path: '/kelas', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Pembayaran SPP', icon: DollarSign, path: '/keuangan/pembayaran-spp', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ],
  guru: [
    { label: 'Jadwal Pelajaran', icon: Calendar, path: '/jadwal-pelajaran', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Nilai Siswa', icon: FileText, path: '/akademik/nilai', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Tugas', icon: BookOpen, path: '/akademik/tugas', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  ],
  siswa: [
    { label: 'Jadwal Pelajaran', icon: Calendar, path: '/jadwal-pelajaran', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Nilai Saya', icon: FileText, path: '/akademik/nilai', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Tugas', icon: BookOpen, path: '/akademik/tugas', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Pembayaran SPP', icon: DollarSign, path: '/keuangan/pembayaran-spp', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ],
  wali: [
    { label: 'Pembayaran SPP', icon: DollarSign, path: '/keuangan/pembayaran-spp', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    { label: 'Nilai Anak', icon: FileText, path: '/akademik/nilai', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  ],
}

const QuickActions = ({ role = 'admin' }) => {
  const navigate = useNavigate()
  const actions = quickActionsByRole[role] || quickActionsByRole.admin

  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className={`p-3 rounded-lg ${action.color}`}>
              <action.icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default QuickActions
