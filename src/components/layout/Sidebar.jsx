import { NavLink, useLocation } from 'react-router-dom'
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
  QrCode,
  Send,
  MessageCircle
} from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { memo, useEffect, useState } from 'react'
import { menuService } from '../../features/menus/services/menuService'
import logoHorizontal from '../../assets/logo akademihub-01-03.png'
import useNavigationProgressStore from '../../store/useNavigationProgressStore'

const SIDEBAR_MENU_CACHE_PREFIX = 'sidebar-menu-cache:'
const SIDEBAR_MENU_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const sidebarMenuRequestCache = new Map()

const getSidebarMenuCacheKey = (userId) => `${SIDEBAR_MENU_CACHE_PREFIX}${userId}`

const getIconComponent = (iconName) => ICON_MAP[iconName] || HelpCircle

const serializeMenuItem = (item) => ({
  id: item.id,
  name: item.name,
  to: item.to,
  iconName: item.iconName,
  children: Array.isArray(item.children) ? item.children.map(serializeMenuItem) : []
})

const hydrateCachedMenuItem = (item) => {
  if (!item || typeof item !== 'object') return null

  const iconName = typeof item.iconName === 'string'
    ? item.iconName
    : typeof item.icon === 'string'
      ? item.icon
      : null

  if (!iconName) {
    return null
  }

  return {
    id: item.id,
    name: item.name,
    to: item.to,
    iconName,
    icon: getIconComponent(iconName),
    children: Array.isArray(item.children)
      ? item.children.map(hydrateCachedMenuItem).filter(Boolean)
      : []
  }
}

const readSidebarMenuCache = (userId) => {
  if (!userId || typeof window === 'undefined') return null

  try {
    const cached = window.sessionStorage.getItem(getSidebarMenuCacheKey(userId))
    if (!cached) return null

    const parsed = JSON.parse(cached)

    // Support legacy format (plain array) — treat as expired
    if (Array.isArray(parsed)) return null

    if (!parsed || !Array.isArray(parsed.data)) return null

    if (Date.now() - parsed.cachedAt > SIDEBAR_MENU_CACHE_TTL_MS) return null

    const hydratedMenus = parsed.data.map(hydrateCachedMenuItem).filter(Boolean)

    return hydratedMenus.length === parsed.data.length ? hydratedMenus : null
  } catch {
    return null
  }
}

const writeSidebarMenuCache = (userId, menus) => {
  if (!userId || typeof window === 'undefined') return

  try {
    const serializedMenus = Array.isArray(menus) ? menus.map(serializeMenuItem) : []
    const cacheEntry = { data: serializedMenus, cachedAt: Date.now() }
    window.sessionStorage.setItem(getSidebarMenuCacheKey(userId), JSON.stringify(cacheEntry))
  } catch {
    // Ignore sessionStorage write failures and fall back to in-memory state only.
  }
}

const clearSidebarMenuCache = (userId) => {
  if (!userId || typeof window === 'undefined') return

  sidebarMenuRequestCache.delete(userId)

  try {
    window.sessionStorage.removeItem(getSidebarMenuCacheKey(userId))
  } catch {
    // Ignore sessionStorage cleanup failures.
  }
}

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
  'bi-whatsapp': MessageCircle,
  'bi-qr-code': QrCode,
  'bi-send': Send,
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
  MessageCircle,
  HelpCircle,
  Clock,
  QrCode,
  Send
}

const normalizePath = (path) => {
  if (!path || path === '/') return '/'
  return path.replace(/\/+$/, '') || '/'
}

const MenuItem = memo(({ item, currentPath, onClose, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (typeof item.icon !== 'function' && typeof item.icon !== 'object') {
    console.error('[Sidebar][MenuItem] Invalid icon type detected', {
      id: item?.id,
      name: item?.name,
      iconType: typeof item?.icon,
      iconValue: item?.icon
    })
  }

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
              <MenuItem
                key={child.id}
                item={child}
                currentPath={currentPath}
                onClose={onClose}
                onNavigate={onNavigate}
              />
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
        onClick={() => {
          if (normalizePath(item.to) !== currentPath) {
            onNavigate?.(item.to)
          }
          onClose?.()
        }}
      >
        <item.icon size={20} />
        <span>{item.name}</span>
      </NavLink>
    </li>
  )
})

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const startNavigation = useNavigationProgressStore((state) => state.startNavigation)
  const [navigation, setNavigation] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const currentPath = normalizePath(location.pathname)

  const handleMenuNavigate = () => {
    startNavigation()
  }

  useEffect(() => {
    const fetchMenus = async () => {
      if (!user?.id) {
        setNavigation([])
        setLoading(false)
        clearSidebarMenuCache(user?.id)
        return
      }

      const cachedMenus = readSidebarMenuCache(user.id)
      if (cachedMenus) {
        setNavigation(cachedMenus)
        setError(null)
        setLoading(false)
        return
      }

      clearSidebarMenuCache(user.id)

      try {
        setLoading(true)
        setError(null)

        let request = sidebarMenuRequestCache.get(user.id)

        if (!request) {
          request = menuService.getTree()
          sidebarMenuRequestCache.set(user.id, request)
        }

        const { data, error: apiError } = await request

        if (apiError) {
          console.error('Failed to fetch menus:', apiError)
          setError('Failed to load menu')
          setNavigation([])
          clearSidebarMenuCache(user.id)
          return
        }

        // Extract menu data from response
        const menuData = data?.data

        if (!menuData || !Array.isArray(menuData)) {
          setNavigation([])
          writeSidebarMenuCache(user.id, [])
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
          const iconName = typeof item.icon === 'string' ? item.icon : null

          const menuItem = {
            name: item.nama_menu,
            to: toFrontendRoute(item.url),
            iconName,
            icon: getIconComponent(iconName),
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

        writeSidebarMenuCache(user.id, mappedMenus)
        setNavigation(mappedMenus)
      } catch (err) {
        console.error('Error fetching menus:', err)
        setError('Failed to load menu')
        setNavigation([])
        clearSidebarMenuCache(user.id)
      } finally {
        sidebarMenuRequestCache.delete(user.id)
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
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-4">
            <img
              src={logoHorizontal}
              alt="AkademiHub"
              className="h-10 w-auto object-contain"
            />
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
                  <MenuItem
                    key={item.id}
                    item={item}
                    currentPath={currentPath}
                    onClose={onClose}
                    onNavigate={handleMenuNavigate}
                  />
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
