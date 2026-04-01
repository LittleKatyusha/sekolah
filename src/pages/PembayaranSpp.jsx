import { Routes, Route } from 'react-router-dom'
import PembayaranSppList from '../features/spp/pages/PembayaranSppList'
import PembayaranSppForm from '../features/spp/pages/PembayaranSppForm'
import PembayaranSppDetail from '../features/spp/pages/PembayaranSppDetail'

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