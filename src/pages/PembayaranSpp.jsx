import { Routes, Route } from 'react-router-dom'
import PembayaranSppList from '../features/pembayaran-spp/pages/PembayaranSppList'
import PembayaranSppDetail from '../features/pembayaran-spp/pages/PembayaranSppDetail'
import PembayaranSppForm from '../features/pembayaran-spp/pages/PembayaranSppForm'

const PembayaranSpp = () => {
  return (
    <Routes>
      <Route path="/" element={<PembayaranSppList />} />
      <Route path="create" element={<PembayaranSppForm />} />
      <Route path=":id" element={<PembayaranSppDetail />} />
      <Route path=":id/edit" element={<PembayaranSppForm />} />
    </Routes>
  )
}

export default PembayaranSpp