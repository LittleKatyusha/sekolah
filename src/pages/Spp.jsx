import { Routes, Route, Navigate } from 'react-router-dom'
import TarifSppList from '../features/spp/pages/TarifSppList'
import TarifSppForm from '../features/spp/pages/TarifSppForm'
import TarifSppDetail from '../features/spp/pages/TarifSppDetail'
import PembayaranSppList from '../features/spp/pages/PembayaranSppList'
import PembayaranSppForm from '../features/spp/pages/PembayaranSppForm'
import PembayaranSppDetail from '../features/spp/pages/PembayaranSppDetail'

const Spp = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="tarif" replace />} />

      <Route path="tarif" element={<TarifSppList />} />
      <Route path="tarif/create" element={<TarifSppForm />} />
      <Route path="tarif/:id" element={<TarifSppDetail />} />
      <Route path="tarif/:id/edit" element={<TarifSppForm />} />

      <Route path="pembayaran" element={<PembayaranSppList />} />
      <Route path="pembayaran/create" element={<PembayaranSppForm />} />
      <Route path="pembayaran/:id" element={<PembayaranSppDetail />} />
      <Route path="pembayaran/:id/edit" element={<PembayaranSppForm />} />
    </Routes>
  )
}

export default Spp