import { Routes, Route } from 'react-router-dom'
import PembayaranSppList from '../features/spp/pages/PembayaranSppList'
import PembayaranSppForm from '../features/spp/pages/PembayaranSppForm'
import PembayaranSppDetail from '../features/spp/pages/PembayaranSppDetail'
import PembayaranSppTunggakan from '../features/spp/pages/PembayaranSppTunggakan'

const PembayaranSpp = () => {
  return (
    <Routes>
      <Route path="/" element={<PembayaranSppList />} />
      <Route path="create" element={<PembayaranSppForm />} />
      <Route path="tunggakan" element={<PembayaranSppTunggakan />} />
      <Route path=":id" element={<PembayaranSppDetail />} />
      <Route path=":id/edit" element={<PembayaranSppForm />} />
    </Routes>
  )
}

export default PembayaranSpp