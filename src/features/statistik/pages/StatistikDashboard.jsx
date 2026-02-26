import { lazy, Suspense, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, UserCheck, Wallet,
  Shield, UserPlus, BookOpen, FileText,
  Trophy, Building2, Users, BarChart3,
  Loader2,
} from 'lucide-react'
import { usePageTitle } from '../../../hooks/usePageTitle'

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/statistik/overview' },
  { key: 'akademik', label: 'Akademik', icon: GraduationCap, path: '/statistik/akademik' },
  { key: 'kehadiran', label: 'Kehadiran', icon: UserCheck, path: '/statistik/kehadiran' },
  { key: 'keuangan', label: 'Keuangan', icon: Wallet, path: '/statistik/keuangan' },
  { key: 'bk', label: 'BK', icon: Shield, path: '/statistik/bk' },
  { key: 'ppdb', label: 'PPDB', icon: UserPlus, path: '/statistik/ppdb' },
  { key: 'perpustakaan', label: 'Perpustakaan', icon: BookOpen, path: '/statistik/perpustakaan' },
  { key: 'ujian', label: 'Ujian', icon: FileText, path: '/statistik/ujian' },
  { key: 'ekstrakurikuler', label: 'Ekskul', icon: Trophy, path: '/statistik/ekstrakurikuler' },
  { key: 'organisasi', label: 'Organisasi', icon: Building2, path: '/statistik/organisasi' },
  { key: 'guru', label: 'Guru', icon: Users, path: '/statistik/guru' },
  { key: 'spk', label: 'SPK', icon: BarChart3, path: '/statistik/spk' },
]

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 size={32} className="animate-spin text-primary-500" />
  </div>
)

const StatistikDashboard = () => {
  usePageTitle('Statistik')
  const location = useLocation()
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  // Redirect /statistik to /statistik/overview
  useEffect(() => {
    if (location.pathname === '/statistik' || location.pathname === '/statistik/') {
      navigate('/statistik/overview', { replace: true })
    }
  }, [location.pathname, navigate])

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return
    const active = scrollRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [location.pathname])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Dashboard statistik dan analitik sekolah
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 md:flex-wrap"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.path

            return (
              <NavLink
                key={tab.key}
                to={tab.path}
                data-active={isActive}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  whitespace-nowrap transition-all duration-200 shrink-0
                  ${isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
        {/* Fade edges for scroll indication */}
        <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white dark:from-gray-900 pointer-events-none md:hidden" />
      </div>

      {/* Tab Content */}
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

export default StatistikDashboard