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
const MenuList = lazy(() => import('./features/menus/pages/MenuList'))
const MenuForm = lazy(() => import('./features/menus/pages/MenuForm'))
const Analytics = lazy(() => import('./pages/Analytics'))
const DataGrid = lazy(() => import('./pages/DataGrid'))
const Settings = lazy(() => import('./pages/Settings'))
const Siswa = lazy(() => import('./pages/Siswa'))
const Kelas = lazy(() => import('./pages/Kelas'))
const Guru = lazy(() => import('./pages/Guru'))
const Absensi = lazy(() => import('./pages/Absensi'))
const AbsensiSiswaList = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaList'))
const AbsensiSiswaForm = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaForm'))
const AbsensiSiswaDetail = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaDetail'))
const AbsensiGuruList = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruList'))
const AbsensiGuruForm = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruForm'))
const AbsensiGuruDetail = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruDetail'))
const Nilai = lazy(() => import('./pages/Nilai'))
const BK = lazy(() => import('./pages/BK'))

// BK Module
const BkJenisList = lazy(() => import('./features/bk/pages/BkJenisList'))
const BkJenisForm = lazy(() => import('./features/bk/pages/BkJenisForm'))
const BkJenisDetail = lazy(() => import('./features/bk/pages/BkJenisDetail'))
const BkKategoriList = lazy(() => import('./features/bk/pages/BkKategoriList'))
const BkKategoriForm = lazy(() => import('./features/bk/pages/BkKategoriForm'))
const BkKategoriDetail = lazy(() => import('./features/bk/pages/BkKategoriDetail'))
const BkKasusList = lazy(() => import('./features/bk/pages/BkKasusList'))
const BkKasusForm = lazy(() => import('./features/bk/pages/BkKasusForm'))
const BkKasusDetail = lazy(() => import('./features/bk/pages/BkKasusDetail'))
const BkSesiList = lazy(() => import('./features/bk/pages/BkSesiList'))
const BkSesiForm = lazy(() => import('./features/bk/pages/BkSesiForm'))
const BkSesiDetail = lazy(() => import('./features/bk/pages/BkSesiDetail'))
const BkHasilList = lazy(() => import('./features/bk/pages/BkHasilList'))
const BkHasilForm = lazy(() => import('./features/bk/pages/BkHasilForm'))
const BkHasilDetail = lazy(() => import('./features/bk/pages/BkHasilDetail'))
const BkTindakanList = lazy(() => import('./features/bk/pages/BkTindakanList'))
const BkTindakanForm = lazy(() => import('./features/bk/pages/BkTindakanForm'))
const BkTindakanDetail = lazy(() => import('./features/bk/pages/BkTindakanDetail'))
const BkLampiranList = lazy(() => import('./features/bk/pages/BkLampiranList'))
const BkLampiranForm = lazy(() => import('./features/bk/pages/BkLampiranForm'))
const BkLampiranDetail = lazy(() => import('./features/bk/pages/BkLampiranDetail'))
const BkWaliList = lazy(() => import('./features/bk/pages/BkWaliList'))
const BkWaliForm = lazy(() => import('./features/bk/pages/BkWaliForm'))
const BkWaliDetail = lazy(() => import('./features/bk/pages/BkWaliDetail'))

// Mapel routes
const MapelList = lazy(() => import('./features/mapel/pages/MapelList'))
const MapelForm = lazy(() => import('./features/mapel/pages/MapelForm'))
const MapelDetail = lazy(() => import('./features/mapel/pages/MapelDetail'))

// Wali routes
const WaliList = lazy(() => import('./features/wali/pages/WaliList'))
const WaliDetail = lazy(() => import('./features/wali/pages/WaliDetail'))
const WaliForm = lazy(() => import('./features/wali/pages/WaliForm'))

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
      '/mapel': 'Mata Pelajaran',
      '/wali': 'Wali Murid',
      '/absensi': 'Absensi',
      '/absensi-siswa': 'Absensi Siswa',
      '/absensi-guru': 'Absensi Guru',
      '/nilai': 'Nilai',
      '/bk': 'Bimbingan Konseling',
      '/bk/jenis': 'Jenis BK',
      '/bk/kategori': 'Kategori BK',
      '/bk/kasus': 'Kasus BK',
      '/bk/sesi': 'Sesi Konseling',
      '/bk/hasil': 'Hasil Konseling',
      '/bk/tindakan': 'Tindakan BK',
      '/bk/lampiran': 'Lampiran BK',
      '/bk/wali': 'Wali BK',
      '/unauthorized': 'Unauthorized',
      '/admin/activity-logs': 'Activity Logs',
      '/admin/menus': 'Manajemen Menu',
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
              
              {/* Mapel: Admin (1) */}
              <Route
                path="/mapel"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MapelList />
                  </RoleGuard>
                }
              />
              <Route
                path="/mapel/create"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MapelForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/mapel/:id"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MapelDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/mapel/:id/edit"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MapelForm />
                  </RoleGuard>
                }
              />
              
              {/* Wali Routes: Admin (1) */}
              <Route
                path="/wali"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <WaliList />
                  </RoleGuard>
                }
              />
              <Route
                path="/wali/create"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <WaliForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/wali/:id"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <WaliDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/wali/:id/edit"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <WaliForm />
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
              
              {/* Absensi Siswa: Admin (1), Guru (2) */}
              <Route
                path="/absensi-siswa"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiSiswaList />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-siswa/tambah"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiSiswaForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-siswa/edit/:id"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiSiswaForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-siswa/:id"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiSiswaDetail />
                  </RoleGuard>
                }
              />

              {/* Absensi Guru: Admin (1), Guru (2) */}
              <Route
                path="/absensi-guru"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiGuruList />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-guru/tambah"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiGuruForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-guru/edit/:id"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiGuruForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/absensi-guru/:id"
                element={
                  <RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}>
                    <AbsensiGuruDetail />
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
              
              {/* BK Module - Dashboard */}
              <Route path="/bk" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BK /></RoleGuard>} />

              {/* BK Jenis */}
              <Route path="/bk/jenis" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisList /></RoleGuard>} />
              <Route path="/bk/jenis/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisForm /></RoleGuard>} />
              <Route path="/bk/jenis/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisDetail /></RoleGuard>} />
              <Route path="/bk/jenis/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisForm /></RoleGuard>} />

              {/* BK Kategori */}
              <Route path="/bk/kategori" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriList /></RoleGuard>} />
              <Route path="/bk/kategori/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriForm /></RoleGuard>} />
              <Route path="/bk/kategori/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriDetail /></RoleGuard>} />
              <Route path="/bk/kategori/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriForm /></RoleGuard>} />

              {/* BK Kasus */}
              <Route path="/bk/kasus" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusList /></RoleGuard>} />
              <Route path="/bk/kasus/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusForm /></RoleGuard>} />
              <Route path="/bk/kasus/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusDetail /></RoleGuard>} />
              <Route path="/bk/kasus/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusForm /></RoleGuard>} />

              {/* BK Sesi */}
              <Route path="/bk/sesi" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiList /></RoleGuard>} />
              <Route path="/bk/sesi/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiForm /></RoleGuard>} />
              <Route path="/bk/sesi/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiDetail /></RoleGuard>} />
              <Route path="/bk/sesi/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiForm /></RoleGuard>} />

              {/* BK Hasil */}
              <Route path="/bk/hasil" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilList /></RoleGuard>} />
              <Route path="/bk/hasil/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilForm /></RoleGuard>} />
              <Route path="/bk/hasil/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilDetail /></RoleGuard>} />
              <Route path="/bk/hasil/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilForm /></RoleGuard>} />

              {/* BK Tindakan */}
              <Route path="/bk/tindakan" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanList /></RoleGuard>} />
              <Route path="/bk/tindakan/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanForm /></RoleGuard>} />
              <Route path="/bk/tindakan/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanDetail /></RoleGuard>} />
              <Route path="/bk/tindakan/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanForm /></RoleGuard>} />

              {/* BK Lampiran - NO edit route (no update endpoint) */}
              <Route path="/bk/lampiran" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranList /></RoleGuard>} />
              <Route path="/bk/lampiran/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranForm /></RoleGuard>} />
              <Route path="/bk/lampiran/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranDetail /></RoleGuard>} />

              {/* BK Wali */}
              <Route path="/bk/wali" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliList /></RoleGuard>} />
              <Route path="/bk/wali/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliForm /></RoleGuard>} />
              <Route path="/bk/wali/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliDetail /></RoleGuard>} />
              <Route path="/bk/wali/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliForm /></RoleGuard>} />
              
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
              <Route
                path="/admin/menus"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MenuList />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/menus/create"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MenuForm />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/menus/:id/edit"
                element={
                  <RoleGuard allowedRoles={[1, 'admin']}>
                    <MenuForm />
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
