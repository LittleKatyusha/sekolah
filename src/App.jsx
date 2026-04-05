
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/guards/RoleGuard'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import useAuthStore from './store/useAuthStore'
import echoService from './services/echoService'
import useNotificationStore from './store/useNotificationStore'
import { setAuthExpiredHandler } from './utils/api'
import NavigationProgress from './components/ui/NavigationProgress'
import useNavigationProgressStore from './store/useNavigationProgressStore'
import { usePageTitle } from './hooks/usePageTitle'

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
const TesMinatBakat = lazy(() => import('./pages/TesMinatBakat'))
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
const PortalPpdb = lazy(() => import('./features/ppdb/pages/PortalPpdb'))
const Sekolah = lazy(() => import('./pages/Sekolah'))
const Statistik = lazy(() => import('./pages/Statistik'))
const Spk = lazy(() => import('./pages/Spk'))
const EWS = lazy(() => import('./pages/EWS'))
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
const Waha = lazy(() => import('./pages/Waha'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

const NavigationProgressObserver = () => {
  const location = useLocation()
  const markRouteReady = useNavigationProgressStore((state) => state.markRouteReady)

  useEffect(() => {
    markRouteReady()
  }, [location.pathname, location.search, markRouteReady])

  return null
}

const TitleUpdater = () => {
  usePageTitle()
  return null
}

// ── WebSocket lifecycle manager ───────────────────────────────────────────────
// Mounted once inside BrowserRouter; manages connection based on auth state.
function WebSocketManager() {
  const { isAuthenticated, token, user } = useAuthStore()
  const { addNotification, setWsStatus } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id) {
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

    // Subscribe to the per-user Laravel notification channel.
    // App.Models.User.{id} is registered in channels.php and is the
    // standard Laravel private notification channel for this user only.
    const userChannel = `App.Models.User.${user.id}`
    echoService.subscribe(userChannel)

    return () => {
      offStatus()
      offNotif()
      echoService.unsubscribe(userChannel)
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
        <NavigationProgress />
        <TitleUpdater />
        <NavigationProgressObserver />
        <AuthExpiryNavigator />
        <WebSocketManager />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Public PPDB portal — no authentication required */}
            <Route path="/ppdb/portal" element={<PortalPpdb />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Siswa */}
              <Route path="/siswa/*" element={<Siswa />} />

              {/* Kelas */}
              <Route path="/kelas/*" element={<Kelas />} />

              {/* Guru */}
              <Route path="/guru/*" element={<Guru />} />

              {/* Mapel */}
              <Route path="/mapel" element={<MapelList />} />
              <Route path="/mapel/create" element={<MapelForm />} />
              <Route path="/mapel/:id" element={<MapelDetail />} />
              <Route path="/mapel/:id/edit" element={<MapelForm />} />

              {/* Wali */}
              <Route path="/wali" element={<WaliList />} />
              <Route path="/wali/create" element={<WaliForm />} />
              <Route path="/wali/:id" element={<WaliDetail />} />
              <Route path="/wali/:id/edit" element={<WaliForm />} />

              {/* Absensi Siswa */}
              <Route path="/absensi-siswa" element={<AbsensiSiswaList />} />
              <Route path="/absensi-siswa/tambah" element={<AbsensiSiswaForm />} />
              <Route path="/absensi-siswa/edit/:id" element={<AbsensiSiswaForm />} />
              <Route path="/absensi-siswa/:id" element={<AbsensiSiswaDetail />} />

              {/* Absensi Guru */}
              <Route path="/absensi-guru" element={<AbsensiGuruList />} />
              <Route path="/absensi-guru/tambah" element={<AbsensiGuruForm />} />
              <Route path="/absensi-guru/edit/:id" element={<AbsensiGuruForm />} />
              <Route path="/absensi-guru/:id" element={<AbsensiGuruDetail />} />

              {/* ===== AKADEMIK ===== */}
              <Route path="/akademik/nilai/*" element={<Nilai />} />
              <Route path="/akademik/tugas/*" element={<Tugas />} />
              <Route path="/akademik/tugas-siswa/*" element={<TugasSiswa />} />
              <Route path="/akademik/ranking/*" element={<Ranking />} />
              <Route path="/akademik/rapor/*" element={<Rapor />} />
              <Route path="/akademik/forum/*" element={<Forum />} />
              <Route path="/akademik/materi/*" element={<Materi />} />
              <Route path="/akademik/presensi" element={<PresensiList />} />
              <Route path="/akademik/presensi/tambah" element={<PresensiForm />} />
              <Route path="/akademik/presensi/edit/:id" element={<PresensiForm />} />
              <Route path="/akademik/presensi/:id" element={<PresensiDetail />} />
              <Route path="/akademik/ujian-jawaban" element={<UjianJawabanList />} />
              <Route path="/akademik/ujian-jawaban/:id" element={<UjianJawabanDetail />} />
              <Route path="/akademik/ujian-jawaban/:id/edit" element={<UjianJawabanForm />} />
              <Route path="/akademik/tes-minat-bakat/*" element={<TesMinatBakat />} />
              <Route path="/akademik/log-akses-materi" element={<LogAksesMateriList />} />
              <Route path="/akademik/log-akses-materi/:id" element={<LogAksesMateriDetail />} />

              {/* Ujian */}
              <Route path="/akademik/ujian" element={<UjianList />} />
              <Route path="/akademik/ujian/create" element={<UjianForm />} />
              <Route path="/akademik/ujian/:id" element={<UjianDetail />} />
              <Route path="/akademik/ujian/:id/edit" element={<UjianForm />} />
              <Route path="/akademik/ujian/:id/nilai" element={<UjianNilai />} />

              {/* Soal (Bank Soal) */}
              <Route path="/akademik/soals" element={<SoalList />} />
              <Route path="/akademik/soals/create" element={<SoalForm />} />
              <Route path="/akademik/soals/:id" element={<SoalDetail />} />
              <Route path="/akademik/soals/:id/edit" element={<SoalForm />} />

              {/* Ujian User */}
              <Route path="/akademik/ujian-user/*" element={<UjianUser />} />

              {/* ===== ADMIN ===== */}
              <Route path="/admin/tahun-ajaran/*" element={<TahunAjaran />} />
              <Route path="/admin/semester/*" element={<Semester />} />
              <Route path="/admin/kalender-akademik/*" element={<KalenderAkademik />} />
              <Route path="/admin/roles/*" element={<Roles />} />
              <Route path="/admin/permissions/*" element={<Permissions />} />
              <Route path="/admin/role-permissions/*" element={<RolePermissions />} />
              <Route path="/admin/hari-operasional" element={<HariOperasional />} />
              <Route path="/admin/kalender-harian" element={<KalenderHarian />} />
              <Route path="/admin/references" element={<ReferenceList />} />
              <Route path="/admin/references/create" element={<ReferenceForm />} />
              <Route path="/admin/references/:id" element={<ReferenceDetail />} />
              <Route path="/admin/references/:id/edit" element={<ReferenceForm />} />
              <Route path="/admin/kalender-tipe" element={<KalenderTipeList />} />
              <Route path="/admin/kalender-tipe/create" element={<KalenderTipeForm />} />
              <Route path="/admin/kalender-tipe/:id/edit" element={<KalenderTipeForm />} />

              {/* ===== KEUANGAN (SPP split) ===== */}
              <Route path="/keuangan/tarif-spp/*" element={<TarifSpp />} />
              <Route path="/keuangan/pembayaran-spp/*" element={<PembayaranSpp />} />

              {/* Ekstrakurikuler */}
              <Route path="/ekstrakurikuler/*" element={<Ekstrakurikuler />} />

              {/* Organisasi */}
              <Route path="/organisasi/*" element={<Organisasi />} />

              {/* PPDB */}
              <Route path="/ppdb/*" element={<Ppdb />} />

              {/* Sekolah */}
              <Route path="/sekolah/*" element={<Sekolah />} />

              {/* Statistik */}
              <Route path="/statistik/*" element={<Statistik />} />

              {/* SPK */}
              <Route path="/spk/*" element={<Spk />} />

              {/* EWS */}
              <Route path="/ews/*" element={<EWS />} />

              {/* Jadwal Pelajaran */}
              <Route path="/jadwal-pelajaran/*" element={<JadwalPelajaran />} />

              {/* Files */}
              <Route path="/files" element={<Files />} />

              {/* WAHA */}
              <Route path="/waha" element={<Navigate to="/waha/session" replace />} />
              <Route path="/waha/*" element={<Waha />} />
              {/* Redirect /whatsapp/* (backend API path) to frontend WAHA routes */}
              <Route path="/whatsapp" element={<Navigate to="/waha/session" replace />} />
              <Route path="/whatsapp/session" element={<Navigate to="/waha/session" replace />} />
              <Route path="/whatsapp/send" element={<Navigate to="/waha/send" replace />} />
              <Route path="/whatsapp/*" element={<Navigate to="/waha/session" replace />} />

              {/* BK Module */}
              <Route path="/bk" element={<BK />} />
              <Route path="/bk/jenis" element={<BkJenisList />} />
              <Route path="/bk/jenis/create" element={<BkJenisForm />} />
              <Route path="/bk/jenis/:id" element={<BkJenisDetail />} />
              <Route path="/bk/jenis/:id/edit" element={<BkJenisForm />} />
              <Route path="/bk/kategori" element={<BkKategoriList />} />
              <Route path="/bk/kategori/create" element={<BkKategoriForm />} />
              <Route path="/bk/kategori/:id" element={<BkKategoriDetail />} />
              <Route path="/bk/kategori/:id/edit" element={<BkKategoriForm />} />
              <Route path="/bk/kasus" element={<BkKasusList />} />
              <Route path="/bk/kasus/create" element={<BkKasusForm />} />
              <Route path="/bk/kasus/:id" element={<BkKasusDetail />} />
              <Route path="/bk/kasus/:id/edit" element={<BkKasusForm />} />
              <Route path="/bk/sesi" element={<BkSesiList />} />
              <Route path="/bk/sesi/create" element={<BkSesiForm />} />
              <Route path="/bk/sesi/:id" element={<BkSesiDetail />} />
              <Route path="/bk/sesi/:id/edit" element={<BkSesiForm />} />
              <Route path="/bk/hasil" element={<BkHasilList />} />
              <Route path="/bk/hasil/create" element={<BkHasilForm />} />
              <Route path="/bk/hasil/:id" element={<BkHasilDetail />} />
              <Route path="/bk/hasil/:id/edit" element={<BkHasilForm />} />
              <Route path="/bk/tindakan" element={<BkTindakanList />} />
              <Route path="/bk/tindakan/create" element={<BkTindakanForm />} />
              <Route path="/bk/tindakan/:id" element={<BkTindakanDetail />} />
              <Route path="/bk/tindakan/:id/edit" element={<BkTindakanForm />} />
              <Route path="/bk/lampiran" element={<BkLampiranList />} />
              <Route path="/bk/lampiran/create" element={<BkLampiranForm />} />
              <Route path="/bk/lampiran/:id" element={<BkLampiranDetail />} />
              <Route path="/bk/wali" element={<BkWaliList />} />
              <Route path="/bk/wali/create" element={<BkWaliForm />} />
              <Route path="/bk/wali/:id" element={<BkWaliDetail />} />
              <Route path="/bk/wali/:id/edit" element={<BkWaliForm />} />

              {/* Perpustakaan */}
              <Route path="/perpustakaan" element={<Perpustakaan />} />
              <Route path="/perpustakaan/buku" element={<BukuList />} />
              <Route path="/perpustakaan/buku/create" element={<BukuForm />} />
              <Route path="/perpustakaan/buku/:id" element={<BukuDetail />} />
              <Route path="/perpustakaan/buku/:id/edit" element={<BukuForm />} />
              <Route path="/perpustakaan/peminjaman" element={<PeminjamanList />} />
              <Route path="/perpustakaan/peminjaman/create" element={<PeminjamanForm />} />
              <Route path="/perpustakaan/peminjaman/:id" element={<PeminjamanDetail />} />
              <Route path="/perpustakaan/peminjaman/:id/edit" element={<PeminjamanForm />} />

              {/* Users (Admin) */}
              <Route path="/admin/users" element={<UsersList />} />
              <Route path="/admin/users/create" element={<UsersForm />} />
              <Route path="/admin/users/:id" element={<UsersDetail />} />
              <Route path="/admin/users/:id/edit" element={<UsersForm />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/data-grid" element={<DataGrid />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/activity-logs" element={<ActivityLogsList />} />
              <Route path="/admin/activity-logs/:id" element={<ActivityLogDetail />} />
              <Route path="/admin/menus" element={<MenuList />} />
              <Route path="/admin/menus/create" element={<MenuForm />} />
              <Route path="/admin/menus/:id" element={<MenuDetail />} />
              <Route path="/admin/menus/:id/edit" element={<MenuForm />} />
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
