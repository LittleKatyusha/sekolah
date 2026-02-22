import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/guards/RoleGuard'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'
import useAuthStore from './store/useAuthStore'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const UsersList = lazy(() => import('./features/users/pages/UsersList'))
const UsersForm = lazy(() => import('./features/users/pages/UsersForm'))
const UsersDetail = lazy(() => import('./features/users/pages/UsersDetail'))
const ActivityLogsList = lazy(() => import('./features/activity-logs/pages/ActivityLogsList'))
const Analytics = lazy(() => import('./pages/Analytics'))
const DataGrid = lazy(() => import('./pages/DataGrid'))
const Settings = lazy(() => import('./pages/Settings'))
const Siswa = lazy(() => import('./pages/Siswa'))
const Kelas = lazy(() => import('./pages/Kelas'))
const Guru = lazy(() => import('./pages/Guru'))
const Absensi = lazy(() => import('./pages/Absensi'))
const Nilai = lazy(() => import('./pages/Nilai'))
const BK = lazy(() => import('./pages/BK'))

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

// Title updater component
const TitleUpdater = () => {
  const location = useLocation()
  
  useEffect(() => {
    const titles = {
      '/': 'Dashboard',
      '/users': 'Users Management',
      '/analytics': 'Analytics',
      '/data-grid': 'Data Grid',
      '/settings': 'Settings',
      '/login': 'Login',
      '/register': 'Register',
      '/siswa': 'Data Siswa',
      '/kelas': 'Data Kelas',
      '/guru': 'Data Guru',
      '/absensi': 'Absensi',
      '/nilai': 'Nilai',
      '/bk': 'Bimbingan Konseling',
      '/unauthorized': 'Unauthorized',
      '/admin/activity-logs': 'Activity Logs',
    }
    
    const title = titles[location.pathname] || 'Admin Dashboard'
    document.title = `${title} | Admin Dashboard`
  }, [location.pathname])
  
  return null
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TitleUpdater />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public route */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Register />
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              
              {/* Siswa: Admin (1), Guru (2) */}
              <Route
                path="/siswa/*"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <Siswa />
                  </RoleGuard>
                }
              />
              
              {/* Kelas: Admin (1), Guru (2) */}
              <Route
                path="/kelas/*"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <Kelas />
                  </RoleGuard>
                }
              />
              
              {/* Guru: Admin (1) */}
              <Route
                path="/guru/*"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <Guru />
                  </RoleGuard>
                }
              />
              
              {/* Absensi: Admin (1), Guru (2) */}
              <Route
                path="/absensi"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <Absensi />
                  </RoleGuard>
                }
              />
              
              {/* Nilai: Admin (1), Guru (2) */}
              <Route
                path="/nilai"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <Nilai />
                  </RoleGuard>
                }
              />
              
              {/* BK: Admin (1), Guru (2), Staff (3) */}
              <Route
                path="/bk"
                element={
                  <RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}>
                    <BK />
                  </RoleGuard>
                }
              />
              
              {/* Admin only routes - Role 1 */}
              <Route
                path="/users"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <UsersList />
                  </RoleGuard>
                }
              />
              <Route
                path="/users/create"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <UsersForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <UsersDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <UsersForm />
                  </RoleGuard>
                }
              />
              {/* Also handle /admin/users from API menu */}
              <Route
                path="/admin/users/*"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <UsersList />
                  </RoleGuard>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <Analytics />
                  </RoleGuard>
                }
              />
              <Route
                path="/data-grid"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <DataGrid />
                  </RoleGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <Settings />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/activity-logs"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <ActivityLogsList />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Catch all - redirect to home or login */}
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? '/' : '/login'} replace />
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
