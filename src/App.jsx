
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/guards/RoleGuard'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'
import useAuthStore from './store/useAuthStore'
import echoService from './services/echoService'
import useNotificationStore from './store/useNotificationStore'
import { setAuthExpiredHandler } from './utils/api'

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const UsersList = lazy(() => import('./features/users/pages/UsersList'))
const UsersForm = lazy(() => import('./features/users/pages/UsersForm'))
const UsersDetail = lazy(() => import('./features/users/pages/UsersDetail'))
const ActivityLogsList = lazy(() => import('./features/activity-logs/pages/ActivityLogsList'))
const ActivityLogDetail = lazy(() => import('./features/activity-logs/pages/ActivityLogDetail'))
const MenuList = lazy(() => import('./features/menus/pages/MenuList'))
const MenuForm = lazy(() => import('./features/menus/pages/MenuForm'))
const MenuDetail = lazy(() => import('./features/menus/pages/MenuDetail'))
const Analytics = lazy(() => import('./pages/Analytics'))
const DataGrid = lazy(() => import('./pages/DataGrid'))
const Settings = lazy(() => import('./pages/Settings'))
const Siswa = lazy(() => import('./pages/Siswa'))
const Kelas = lazy(() => import('./pages/Kelas'))
const Guru = lazy(() => import('./pages/Guru'))
const AbsensiSiswaList = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaList'))
const AbsensiSiswaForm = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaForm'))
const AbsensiSiswaDetail = lazy(() => import('./features/absensi-siswa/pages/AbsensiSiswaDetail'))
const AbsensiGuruList = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruList'))
const AbsensiGuruForm = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruForm'))
const AbsensiGuruDetail = lazy(() => import('./features/absensi-guru/pages/AbsensiGuruDetail'))
const Nilai = lazy(() => import('./pages/Nilai'))
const BK = lazy(() => import('./pages/BK'))
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
const Perpustakaan = lazy(() => import('./pages/Perpustakaan'))
const BukuList = lazy(() => import('./features/perpustakaan/pages/BukuList'))
const BukuForm = lazy(() => import('./features/perpustakaan/pages/BukuForm'))
const BukuDetail = lazy(() => import('./features/perpustakaan/pages/BukuDetail'))
const PeminjamanList = lazy(() => import('./features/perpustakaan/pages/PeminjamanList'))
const PeminjamanForm = lazy(() => import('./features/perpustakaan/pages/PeminjamanForm'))
const PeminjamanDetail = lazy(() => import('./features/perpustakaan/pages/PeminjamanDetail'))
const MapelList = lazy(() => import('./features/mapel/pages/MapelList'))
const MapelForm = lazy(() => import('./features/mapel/pages/MapelForm'))
const MapelDetail = lazy(() => import('./features/mapel/pages/MapelDetail'))
const WaliList = lazy(() => import('./features/wali/pages/WaliList'))
const WaliDetail = lazy(() => import('./features/wali/pages/WaliDetail'))
const WaliForm = lazy(() => import('./features/wali/pages/WaliForm'))
const UjianList = lazy(() => import('./features/ujian/pages/UjianList'))
const UjianForm = lazy(() => import('./features/ujian/pages/UjianForm'))
const UjianDetail = lazy(() => import('./features/ujian/pages/UjianDetail'))
const UjianNilai = lazy(() => import('./features/ujian/pages/UjianNilai'))
const SoalList = lazy(() => import('./features/soal/pages/SoalList'))
const SoalForm = lazy(() => import('./features/soal/pages/SoalForm'))
const SoalDetail = lazy(() => import('./features/soal/pages/SoalDetail'))
const UjianUser = lazy(() => import('./pages/UjianUser'))
const Tugas = lazy(() => import('./pages/Tugas'))
const Rapor = lazy(() => import('./pages/Rapor'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Forum = lazy(() => import('./pages/Forum'))
const Materi = lazy(() => import('./pages/Materi'))
const TugasSiswa = lazy(() => import('./pages/TugasSiswa'))
const TahunAjaran = lazy(() => import('./pages/TahunAjaran'))
const Semester = lazy(() => import('./pages/Semester'))
const KalenderAkademik = lazy(() => import('./pages/KalenderAkademik'))
const Roles = lazy(() => import('./pages/Roles'))
const Permissions = lazy(() => import('./pages/Permissions'))
const RolePermissions = lazy(() => import('./pages/RolePermissions'))
const TarifSpp = lazy(() => import('./pages/TarifSpp'))
const PembayaranSpp = lazy(() => import('./pages/PembayaranSpp'))
const Ekstrakurikuler = lazy(() => import('./pages/Ekstrakurikuler'))
const Organisasi = lazy(() => import('./pages/Organisasi'))
const Ppdb = lazy(() => import('./pages/Ppdb'))
const Sekolah = lazy(() => import('./pages/Sekolah'))
const Statistik = lazy(() => import('./pages/Statistik'))
const Spk = lazy(() => import('./pages/Spk'))
const JadwalPelajaran = lazy(() => import('./pages/JadwalPelajaran'))
const HariOperasional = lazy(() => import('./features/hari-operasional/pages/HariOperasionalList'))
const KalenderHarian = lazy(() => import('./features/kalender-harian/pages/KalenderHarianList'))
const PresensiList = lazy(() => import('./features/presensi/pages/PresensiList'))
const PresensiForm = lazy(() => import('./features/presensi/pages/PresensiForm'))
const PresensiDetail = lazy(() => import('./features/presensi/pages/PresensiDetail'))
const UjianJawabanList = lazy(() => import('./features/ujian-jawaban/pages/UjianJawabanList'))
const UjianJawabanForm = lazy(() => import('./features/ujian-jawaban/pages/UjianJawabanForm'))
const UjianJawabanDetail = lazy(() => import('./features/ujian-jawaban/pages/UjianJawabanDetail'))
const LogAksesMateriList = lazy(() => import('./features/log-akses-materi/pages/LogAksesMateriList'))
const LogAksesMateriDetail = lazy(() => import('./features/log-akses-materi/pages/LogAksesMateriDetail'))
const ReferenceList = lazy(() => import('./features/references/pages/ReferenceList'))
const ReferenceForm = lazy(() => import('./features/references/pages/ReferenceForm'))
const ReferenceDetail = lazy(() => import('./features/references/pages/ReferenceDetail'))
const KalenderTipeList = lazy(() => import('./features/kalender-tipe/pages/KalenderTipeList'))
const KalenderTipeForm = lazy(() => import('./features/kalender-tipe/pages/KalenderTipeForm'))
const Files = lazy(() => import('./features/files/pages/FileUploadPage'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

const TitleUpdater = () => {
  const location = useLocation()
  useEffect(() => {
    const titles = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/admin/users': 'Users Management',
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
      '/absensi-siswa': 'Absensi Siswa',
      '/absensi-guru': 'Absensi Guru',
      '/akademik/nilai': 'Nilai',
      '/akademik/tugas': 'Tugas',
      '/akademik/tugas-siswa': 'Pengumpulan Tugas',
      '/akademik/ranking': 'Ranking',
      '/akademik/rapor': 'Rapor',
      '/akademik/forum': 'Forum',
      '/akademik/materi': 'Materi',
      '/akademik/presensi': 'Presensi',
      '/akademik/ujian-jawaban': 'Jawaban Ujian',
      '/akademik/log-akses-materi': 'Log Akses Materi',
      '/admin/tahun-ajaran': 'Tahun Ajaran',
      '/admin/semester': 'Semester',
      '/admin/kalender-akademik': 'Kalender Akademik',
      '/admin/roles': 'Roles',
      '/admin/role-permissions': 'Role Permissions',
      '/admin/hari-operasional': 'Hari Operasional',
      '/admin/kalender-harian': 'Kalender Harian',
      '/admin/references': 'System References',
      '/admin/kalender-tipe': 'Kalender Tipe',
      '/keuangan/tarif-spp': 'Tarif SPP',
      '/keuangan/pembayaran-spp': 'Pembayaran SPP',
      '/statistik': 'Statistik',
      '/jadwal-pelajaran': 'Jadwal Pelajaran',
      '/files': 'Files Management',
      '/bk': 'Bimbingan Konseling',
      '/unauthorized': 'Unauthorized',
      '/admin/activity-logs': 'Activity Logs',
      '/admin/menus': 'Manajemen Menu',
    }
    const path = location.pathname
    let title = titles[path]
    if (!title) {
      if (path.startsWith('/perpustakaan')) title = 'Perpustakaan'
      else if (path.startsWith('/akademik/ujian-user')) title = 'Ujian User'
      else if (path.startsWith('/akademik/ujian')) title = 'Ujian'
      else if (path.startsWith('/akademik/soals')) title = 'Bank Soal'
      else if (path.startsWith('/statistik/')) title = 'Statistik'
      else if (path.startsWith('/bk/')) title = 'Bimbingan Konseling'
      else title = 'Admin Dashboard'
    }
    document.title = `${title} | Admin Dashboard`
  }, [location.pathname])
  return null
}

// ── WebSocket lifecycle manager ───────────────────────────────────────────────
// Mounted once inside BrowserRouter; manages connection based on auth state.
function WebSocketManager() {
  const { isAuthenticated, token } = useAuthStore()
  const { addNotification, setWsStatus } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      echoService.disconnect()
      return
    }

    // Connect once for the authenticated lifecycle.
    echoService.connect(token)

    const offStatus = echoService.on('status', (status) => {
      setWsStatus(status)
    })

    const offNotif = echoService.on('notification', (data) => {
      addNotification(data)
    })

    // Subscribe to user-level notification channel once authenticated
    echoService.subscribe('notifications')

    return () => {
      offStatus()
      offNotif()
      echoService.unsubscribe('notifications')
      echoService.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !token) return

    // Refresh auth headers for future private channel auth without reconnecting.
    echoService.updateToken(token)
  }, [isAuthenticated, token])

  return null
}

function AuthExpiryNavigator() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthExpired = () => {
      navigate('/login', { replace: true })
    }

    setAuthExpiredHandler(handleAuthExpired)

    return () => {
      setAuthExpiredHandler(null)
    }
  }, [navigate])

  return null
}

function App() {
  const { isAuthenticated } = useAuthStore()
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TitleUpdater />
        <AuthExpiryNavigator />
        <WebSocketManager />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Siswa */}
              <Route path="/siswa/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Siswa /></RoleGuard>} />

              {/* Kelas */}
              <Route path="/kelas/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Kelas /></RoleGuard>} />

              {/* Guru */}
              <Route path="/guru/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Guru /></RoleGuard>} />

              {/* Mapel */}
              <Route path="/mapel" element={<RoleGuard allowedRoles={[1, 'admin']}><MapelList /></RoleGuard>} />
              <Route path="/mapel/create" element={<RoleGuard allowedRoles={[1, 'admin']}><MapelForm /></RoleGuard>} />
              <Route path="/mapel/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><MapelDetail /></RoleGuard>} />
              <Route path="/mapel/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><MapelForm /></RoleGuard>} />

              {/* Wali */}
              <Route path="/wali" element={<RoleGuard allowedRoles={[1, 'admin']}><WaliList /></RoleGuard>} />
              <Route path="/wali/create" element={<RoleGuard allowedRoles={[1, 'admin']}><WaliForm /></RoleGuard>} />
              <Route path="/wali/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><WaliDetail /></RoleGuard>} />
              <Route path="/wali/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><WaliForm /></RoleGuard>} />

              {/* Absensi Siswa */}
              <Route path="/absensi-siswa" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiSiswaList /></RoleGuard>} />
              <Route path="/absensi-siswa/tambah" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiSiswaForm /></RoleGuard>} />
              <Route path="/absensi-siswa/edit/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiSiswaForm /></RoleGuard>} />
              <Route path="/absensi-siswa/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiSiswaDetail /></RoleGuard>} />

              {/* Absensi Guru */}
              <Route path="/absensi-guru" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiGuruList /></RoleGuard>} />
              <Route path="/absensi-guru/tambah" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiGuruForm /></RoleGuard>} />
              <Route path="/absensi-guru/edit/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiGuruForm /></RoleGuard>} />
              <Route path="/absensi-guru/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><AbsensiGuruDetail /></RoleGuard>} />

              {/* ===== AKADEMIK ===== */}
              <Route path="/akademik/nilai/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Nilai /></RoleGuard>} />
              <Route path="/akademik/tugas/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Tugas /></RoleGuard>} />
              <Route path="/akademik/tugas-siswa/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><TugasSiswa /></RoleGuard>} />
              <Route path="/akademik/ranking/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Ranking /></RoleGuard>} />
              <Route path="/akademik/rapor/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Rapor /></RoleGuard>} />
              <Route path="/akademik/forum/*" element={<RoleGuard allowedRoles={[1, 2, 3, 4, 'admin', 'guru', 'staff', 'siswa']}><Forum /></RoleGuard>} />
              <Route path="/akademik/materi/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Materi /></RoleGuard>} />
              <Route path="/akademik/presensi" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><PresensiList /></RoleGuard>} />
              <Route path="/akademik/presensi/tambah" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><PresensiForm /></RoleGuard>} />
              <Route path="/akademik/presensi/edit/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><PresensiForm /></RoleGuard>} />
              <Route path="/akademik/presensi/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><PresensiDetail /></RoleGuard>} />
              <Route path="/akademik/ujian-jawaban" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianJawabanList /></RoleGuard>} />
              <Route path="/akademik/ujian-jawaban/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianJawabanDetail /></RoleGuard>} />
              <Route path="/akademik/ujian-jawaban/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianJawabanForm /></RoleGuard>} />
              <Route path="/akademik/log-akses-materi" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><LogAksesMateriList /></RoleGuard>} />
              <Route path="/akademik/log-akses-materi/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><LogAksesMateriDetail /></RoleGuard>} />

              {/* Ujian */}
              <Route path="/akademik/ujian" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianList /></RoleGuard>} />
              <Route path="/akademik/ujian/create" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianForm /></RoleGuard>} />
              <Route path="/akademik/ujian/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianDetail /></RoleGuard>} />
              <Route path="/akademik/ujian/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianForm /></RoleGuard>} />
              <Route path="/akademik/ujian/:id/nilai" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianNilai /></RoleGuard>} />

              {/* Soal (Bank Soal) */}
              <Route path="/akademik/soals" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><SoalList /></RoleGuard>} />
              <Route path="/akademik/soals/create" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><SoalForm /></RoleGuard>} />
              <Route path="/akademik/soals/:id" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><SoalDetail /></RoleGuard>} />
              <Route path="/akademik/soals/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><SoalForm /></RoleGuard>} />

              {/* Ujian User */}
              <Route path="/akademik/ujian-user/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><UjianUser /></RoleGuard>} />

              {/* ===== ADMIN ===== */}
              <Route path="/admin/tahun-ajaran/*" element={<RoleGuard allowedRoles={[1, 'admin']}><TahunAjaran /></RoleGuard>} />
              <Route path="/admin/semester/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Semester /></RoleGuard>} />
              <Route path="/admin/kalender-akademik/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><KalenderAkademik /></RoleGuard>} />
              <Route path="/admin/roles/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Roles /></RoleGuard>} />
              <Route path="/admin/permissions/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Permissions /></RoleGuard>} />
              <Route path="/admin/role-permissions/*" element={<RoleGuard allowedRoles={[1, 'admin']}><RolePermissions /></RoleGuard>} />
              <Route path="/admin/hari-operasional" element={<RoleGuard allowedRoles={[1, 'admin']}><HariOperasional /></RoleGuard>} />
              <Route path="/admin/kalender-harian" element={<RoleGuard allowedRoles={[1, 'admin']}><KalenderHarian /></RoleGuard>} />
              <Route path="/admin/references" element={<RoleGuard allowedRoles={[1, 'admin']}><ReferenceList /></RoleGuard>} />
              <Route path="/admin/references/create" element={<RoleGuard allowedRoles={[1, 'admin']}><ReferenceForm /></RoleGuard>} />
              <Route path="/admin/references/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><ReferenceDetail /></RoleGuard>} />
              <Route path="/admin/references/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><ReferenceForm /></RoleGuard>} />
              <Route path="/admin/kalender-tipe" element={<RoleGuard allowedRoles={[1, 'admin']}><KalenderTipeList /></RoleGuard>} />
              <Route path="/admin/kalender-tipe/create" element={<RoleGuard allowedRoles={[1, 'admin']}><KalenderTipeForm /></RoleGuard>} />
              <Route path="/admin/kalender-tipe/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><KalenderTipeForm /></RoleGuard>} />

              {/* ===== KEUANGAN (SPP split) ===== */}
              <Route path="/keuangan/tarif-spp/*" element={<RoleGuard allowedRoles={[1, 'admin']}><TarifSpp /></RoleGuard>} />
              <Route path="/keuangan/pembayaran-spp/*" element={<RoleGuard allowedRoles={[1, 'admin']}><PembayaranSpp /></RoleGuard>} />

              {/* Ekstrakurikuler */}
              <Route path="/ekstrakurikuler/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Ekstrakurikuler /></RoleGuard>} />

              {/* Organisasi */}
              <Route path="/organisasi/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Organisasi /></RoleGuard>} />

              {/* PPDB */}
              <Route path="/ppdb/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Ppdb /></RoleGuard>} />

              {/* Sekolah */}
              <Route path="/sekolah/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Sekolah /></RoleGuard>} />

              {/* Statistik */}
              <Route path="/statistik/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><Statistik /></RoleGuard>} />

              {/* SPK */}
              <Route path="/spk/*" element={<RoleGuard allowedRoles={[1, 'admin']}><Spk /></RoleGuard>} />

              {/* Jadwal Pelajaran */}
              <Route path="/jadwal-pelajaran/*" element={<RoleGuard allowedRoles={[1, 2, 'admin', 'guru']}><JadwalPelajaran /></RoleGuard>} />

              {/* Files */}
              <Route path="/files" element={<RoleGuard allowedRoles={[1, 'admin']}><Files /></RoleGuard>} />

              {/* BK Module */}
              <Route path="/bk" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BK /></RoleGuard>} />
              <Route path="/bk/jenis" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisList /></RoleGuard>} />
              <Route path="/bk/jenis/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisForm /></RoleGuard>} />
              <Route path="/bk/jenis/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisDetail /></RoleGuard>} />
              <Route path="/bk/jenis/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkJenisForm /></RoleGuard>} />
              <Route path="/bk/kategori" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriList /></RoleGuard>} />
              <Route path="/bk/kategori/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriForm /></RoleGuard>} />
              <Route path="/bk/kategori/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriDetail /></RoleGuard>} />
              <Route path="/bk/kategori/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKategoriForm /></RoleGuard>} />
              <Route path="/bk/kasus" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusList /></RoleGuard>} />
              <Route path="/bk/kasus/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusForm /></RoleGuard>} />
              <Route path="/bk/kasus/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusDetail /></RoleGuard>} />
              <Route path="/bk/kasus/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkKasusForm /></RoleGuard>} />
              <Route path="/bk/sesi" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiList /></RoleGuard>} />
              <Route path="/bk/sesi/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiForm /></RoleGuard>} />
              <Route path="/bk/sesi/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiDetail /></RoleGuard>} />
              <Route path="/bk/sesi/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkSesiForm /></RoleGuard>} />
              <Route path="/bk/hasil" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilList /></RoleGuard>} />
              <Route path="/bk/hasil/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilForm /></RoleGuard>} />
              <Route path="/bk/hasil/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilDetail /></RoleGuard>} />
              <Route path="/bk/hasil/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkHasilForm /></RoleGuard>} />
              <Route path="/bk/tindakan" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanList /></RoleGuard>} />
              <Route path="/bk/tindakan/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanForm /></RoleGuard>} />
              <Route path="/bk/tindakan/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanDetail /></RoleGuard>} />
              <Route path="/bk/tindakan/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkTindakanForm /></RoleGuard>} />
              <Route path="/bk/lampiran" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranList /></RoleGuard>} />
              <Route path="/bk/lampiran/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranForm /></RoleGuard>} />
              <Route path="/bk/lampiran/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkLampiranDetail /></RoleGuard>} />
              <Route path="/bk/wali" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliList /></RoleGuard>} />
              <Route path="/bk/wali/create" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliForm /></RoleGuard>} />
              <Route path="/bk/wali/:id" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliDetail /></RoleGuard>} />
              <Route path="/bk/wali/:id/edit" element={<RoleGuard allowedRoles={[1, 2, 3, 'admin', 'guru', 'staff']}><BkWaliForm /></RoleGuard>} />

              {/* Perpustakaan */}
              <Route path="/perpustakaan" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><Perpustakaan /></RoleGuard>} />
              <Route path="/perpustakaan/buku" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><BukuList /></RoleGuard>} />
              <Route path="/perpustakaan/buku/create" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><BukuForm /></RoleGuard>} />
              <Route path="/perpustakaan/buku/:id" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><BukuDetail /></RoleGuard>} />
              <Route path="/perpustakaan/buku/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><BukuForm /></RoleGuard>} />
              <Route path="/perpustakaan/peminjaman" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><PeminjamanList /></RoleGuard>} />
              <Route path="/perpustakaan/peminjaman/create" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><PeminjamanForm /></RoleGuard>} />
              <Route path="/perpustakaan/peminjaman/:id" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><PeminjamanDetail /></RoleGuard>} />
              <Route path="/perpustakaan/peminjaman/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin', 'petugas_perpustakaan']}><PeminjamanForm /></RoleGuard>} />

              {/* Users (Admin) */}
              <Route path="/admin/users" element={<RoleGuard allowedRoles={[1, 'admin']}><UsersList /></RoleGuard>} />
              <Route path="/admin/users/create" element={<RoleGuard allowedRoles={[1, 'admin']}><UsersForm /></RoleGuard>} />
              <Route path="/admin/users/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><UsersDetail /></RoleGuard>} />
              <Route path="/admin/users/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><UsersForm /></RoleGuard>} />
              <Route path="/analytics" element={<RoleGuard allowedRoles={[1, 'admin']}><Analytics /></RoleGuard>} />
              <Route path="/data-grid" element={<RoleGuard allowedRoles={[1, 'admin']}><DataGrid /></RoleGuard>} />
              <Route path="/settings" element={<RoleGuard allowedRoles={[1, 'admin']}><Settings /></RoleGuard>} />
              <Route path="/admin/activity-logs" element={<RoleGuard allowedRoles={[1, 'admin']}><ActivityLogsList /></RoleGuard>} />
              <Route path="/admin/activity-logs/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><ActivityLogDetail /></RoleGuard>} />
              <Route path="/admin/menus" element={<RoleGuard allowedRoles={[1, 'admin']}><MenuList /></RoleGuard>} />
              <Route path="/admin/menus/create" element={<RoleGuard allowedRoles={[1, 'admin']}><MenuForm /></RoleGuard>} />
              <Route path="/admin/menus/:id" element={<RoleGuard allowedRoles={[1, 'admin']}><MenuDetail /></RoleGuard>} />
              <Route path="/admin/menus/:id/edit" element={<RoleGuard allowedRoles={[1, 'admin']}><MenuForm /></RoleGuard>} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
