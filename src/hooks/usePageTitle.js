import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/': 'Dashboard',
  '/users': 'Users Management',
  '/analytics': 'Analytics',
  '/data-grid': 'Data Grid',
  '/settings': 'Settings',
  '/login': 'Login',
}

export const usePageTitle = () => {
  const location = useLocation()
  
  useEffect(() => {
    const title = pageTitles[location.pathname] || 'Admin Dashboard'
    document.title = `${title} | Admin Dashboard`
  }, [location.pathname])

  return pageTitles[location.pathname] || 'Dashboard'
}
