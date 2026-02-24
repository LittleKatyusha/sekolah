import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Table2,
  Settings,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Award,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  ClipboardList
} from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { memo, useEffect, useState } from 'react'
import { apiService } from '../../utils/api'

// Icon mapping - maps Bootstrap icon names from backend to Lucide components
const ICON_MAP = {
  // Bootstrap Icons to Lucide mapping
  'bi-grid-1x2': LayoutDashboard,
  'bi-speedometer2': LayoutDashboard,
  'bi-house-door': LayoutDashboard,
  'bi-people': Users,
  'bi-people-check': Users,
  'bi-person': Users,
  'bi-person-badge': Users,
  'bi-person-check': Users,
  'bi-person-heart': Users,
  'bi-bar-chart': BarChart3,
  'bi-graph-up': BarChart3,
  'bi-table': Table2,
  'bi-grid': Table2,
  'bi-gear': Settings,
  'bi-gear-fill': Settings,
  'bi-mortarboard': GraduationCap,
  'bi-book': GraduationCap,
  'bi-clipboard-check': ClipboardCheck,
  'bi-clipboard-data': ClipboardCheck,
  'bi-check-square': ClipboardCheck,
  'bi-award': Award,
  'bi-trophy': Award,
  'bi-chat-dots': MessageSquare,
  'bi-chat': MessageSquare,
  'bi-calendar-check': ClipboardCheck,
  'bi-database': Table2,
  'bi-door-open': Table2,
  'bi-file-earmark-text': Table2,
  'bi-file-earmark-ruled': Table2,
  'bi-question-circle': MessageSquare,
  'bi-heart-pulse': MessageSquare,
  'bi-tag': Settings,
  'bi-exclamation-triangle': MessageSquare,
  'bi-bookshelf': GraduationCap,
  'bi-arrow-left-right': Table2,
  'bi-credit-card': BarChart3,
  'bi-cash': BarChart3,
  'bi-receipt': BarChart3,
  'bi-shield': Settings,
  'bi-key': Settings,
  'bi-list': Table2,
  'bi-clock-history': Clock,
  // Fallback for direct Lucide names
  LayoutDashboard,
  Users,
  BarChart3,
  Table2,
  Settings,
  GraduationCap,
  ClipboardCheck,
  Award,
  MessageSquare,
  HelpCircle,
  Clock
}

const MenuItem = ({ item, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sidebar-link w-full"
        >
          <item.icon size={20} />
          <span className="flex-1 text-left">{item.name}</span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && (
          <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {item.children.map((child) => (
              <MenuItem key={child.id} item={child} onClose={onClose} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          isActive ? 'sidebar-link active' : 'sidebar-link'
        }
        onClick={onClose}
      >
        <item.icon size={20} />
        <span>{item.name}</span>
      </NavLink>
    </li>
  )
}

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuthStore()
  const [navigation, setNavigation] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMenus = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const { data, error: apiError } = await apiService.get('/admin/menus/tree/')
        
        if (apiError) {
          console.error('Failed to fetch menus:', apiError)
          setError('Failed to load menu')
          setNavigation([])
          return
        }

        // Extract menu data from response
        const menuData = data?.data
        
        if (!menuData || !Array.isArray(menuData)) {
          setNavigation([])
          return
        }

        // Convert backend API URL to frontend route path
        // e.g. "/api/v1/guru" -> "/guru", "/api/v1/admin/users" -> "/admin/users"
        const toFrontendRoute = (url) => {
          if (!url || url === '#') return null
          // Strip the API base prefix (e.g. /api/v1) to get the frontend route
          return url.replace(/^\/api\/v[0-9]+/, '') || '/'
        }

        // Helper function to map menu items recursively
        const mapMenuItem = (item) => {
          const menuItem = {
            name: item.nama_menu,
            to: toFrontendRoute(item.url),
            icon: ICON_MAP[item.icon] || HelpCircle,
            id: item.id,
            children: []
          }

          // Recursively map sub-menus
          if (item.sub_menus && item.sub_menus.length > 0) {
            menuItem.children = item.sub_menus
              .filter(subMenu => subMenu.is_active)
              .map(mapMenuItem)
          }

          return menuItem
        }

        // Map all top-level menu items
        const mappedMenus = menuData
          .filter(item => item.is_active)
          .map(mapMenuItem)

        // Statically inject Mata Pelajaran menu
        const mapelMenu = {
          name: 'Mata Pelajaran',
          to: '/mapel',
          icon: BookOpen,
          id: 'static-mapel',
          children: []
        }

        // Find logical position (near Guru or Kelas)
        const targetIndex = mappedMenus.findIndex(
          (m) => m.name.toLowerCase().includes('guru') || m.name.toLowerCase().includes('kelas')
        )

        if (targetIndex !== -1) {
          mappedMenus.splice(targetIndex + 1, 0, mapelMenu)
        } else {
          mappedMenus.push(mapelMenu)
        }

        // Statically inject Wali menu
        const waliMenu = {
          name: 'Wali',
          to: '/wali',
          icon: Users,
          id: 'static-wali',
          children: []
        }

        // Find logical position (after Siswa)
        const siswaIndex = mappedMenus.findIndex(
          (m) => m.name.toLowerCase().includes('siswa')
        )

        if (siswaIndex !== -1) {
          mappedMenus.splice(siswaIndex + 1, 0, waliMenu)
        } else {
          // Fallback: If Siswa not found, add it after Mata Pelajaran
          const mapelIndex = mappedMenus.findIndex((m) => m.id === 'static-mapel');
          if (mapelIndex !== -1) {
            mappedMenus.splice(mapelIndex + 1, 0, waliMenu);
          } else {
            mappedMenus.push(waliMenu);
          }
        }

        // Statically inject Absensi Guru menu
        const absensiGuruMenu = {
          name: 'Absensi Guru',
          to: '/absensi-guru',
          icon: ClipboardList,
          id: 'static-absensi-guru',
          children: []
        }

        // Find logical position (after Wali)
        const waliIndex = mappedMenus.findIndex(
          (m) => m.name.toLowerCase() === 'wali'
        )

        if (waliIndex !== -1) {
          mappedMenus.splice(waliIndex + 1, 0, absensiGuruMenu)
        } else {
          mappedMenus.push(absensiGuruMenu)
        }
        
        setNavigation(mappedMenus)
      } catch (err) {
        console.error('Error fetching menus:', err)
        setError('Failed to load menu')
        setNavigation([])
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [user?.id])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Admin
            </h1>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <ul className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </li>
                ))}
              </ul>
            ) : error ? (
              <div className="text-sm text-red-600 dark:text-red-400 text-center p-4">
                {error}
              </div>
            ) : navigation.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center p-4">
                No menu items available
              </div>
            ) : (
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <MenuItem key={item.id} item={item} onClose={onClose} />
                ))}
              </ul>
            )}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(Sidebar)
