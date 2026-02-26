import { Routes, Route } from 'react-router-dom'
import StatistikDashboard from '../features/statistik/pages/StatistikDashboard'

const Statistik = () => {
  return (
    <Routes>
      <Route index element={<StatistikDashboard />} />
      <Route path="overview" element={<StatistikDashboard />} />
      <Route path="akademik" element={<StatistikDashboard />} />
      <Route path="kehadiran" element={<StatistikDashboard />} />
      <Route path="keuangan" element={<StatistikDashboard />} />
      <Route path="bk" element={<StatistikDashboard />} />
      <Route path="ppdb" element={<StatistikDashboard />} />
      <Route path="perpustakaan" element={<StatistikDashboard />} />
      <Route path="ujian" element={<StatistikDashboard />} />
      <Route path="ekstrakurikuler" element={<StatistikDashboard />} />
      <Route path="organisasi" element={<StatistikDashboard />} />
      <Route path="guru" element={<StatistikDashboard />} />
      <Route path="spk" element={<StatistikDashboard />} />
    </Routes>
  )
}

export default Statistik