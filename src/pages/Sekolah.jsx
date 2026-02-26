import { Routes, Route } from 'react-router-dom'
import SekolahDetail from '../features/sekolah/pages/SekolahDetail'
import SekolahForm from '../features/sekolah/pages/SekolahForm'

const Sekolah = () => {
  return (
    <Routes>
      <Route index element={<SekolahDetail />} />
      <Route path="edit" element={<SekolahForm />} />
    </Routes>
  )
}

export default Sekolah