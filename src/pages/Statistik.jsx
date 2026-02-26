import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import StatistikDashboard from '../features/statistik/pages/StatistikDashboard'

const OverviewStats = lazy(() => import('../features/statistik/components/OverviewStats'))
const AkademikStats = lazy(() => import('../features/statistik/components/AkademikStats'))
const KehadiranStats = lazy(() => import('../features/statistik/components/KehadiranStats'))
const KeuanganStats = lazy(() => import('../features/statistik/components/KeuanganStats'))
const BkStats = lazy(() => import('../features/statistik/components/BkStats'))
const PpdbStats = lazy(() => import('../features/statistik/components/PpdbStats'))
const PerpustakaanStats = lazy(() => import('../features/statistik/components/PerpustakaanStats'))
const UjianStats = lazy(() => import('../features/statistik/components/UjianStats'))
const EkstrakurikulerStats = lazy(() => import('../features/statistik/components/EkstrakurikulerStats'))
const OrganisasiStats = lazy(() => import('../features/statistik/components/OrganisasiStats'))
const GuruStats = lazy(() => import('../features/statistik/components/GuruStats'))
const SpkStats = lazy(() => import('../features/statistik/components/SpkStats'))

const Statistik = () => {
  return (
    <Routes>
      <Route element={<StatistikDashboard />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewStats />} />
        <Route path="akademik" element={<AkademikStats />} />
        <Route path="kehadiran" element={<KehadiranStats />} />
        <Route path="keuangan" element={<KeuanganStats />} />
        <Route path="bk" element={<BkStats />} />
        <Route path="ppdb" element={<PpdbStats />} />
        <Route path="perpustakaan" element={<PerpustakaanStats />} />
        <Route path="ujian" element={<UjianStats />} />
        <Route path="ekstrakurikuler" element={<EkstrakurikulerStats />} />
        <Route path="organisasi" element={<OrganisasiStats />} />
        <Route path="guru" element={<GuruStats />} />
        <Route path="spk" element={<SpkStats />} />
      </Route>
    </Routes>
  )
}

export default Statistik