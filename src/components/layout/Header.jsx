import { Menu, Moon, Sun, Bell } from 'lucide-react'
import useThemeStore from '../../store/useThemeStore'
import { usePageTitle } from '../../hooks/usePageTitle'
import { memo } from 'react'

const Header = ({ onMenuClick }) => {
  const { isDarkMode, toggleTheme } = useThemeStore()
  const pageTitle = usePageTitle()

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)
