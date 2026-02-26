import { Routes, Route } from 'react-router-dom'
import SiswaList from '../features/siswa/pages/SiswaList'
import SiswaForm from '../features/siswa/pages/SiswaForm'
import SiswaDetail from '../features/siswa/pages/SiswaDetail'

const Siswa = () => {
  return (
    <Routes>
      <Route path="/" element={<SiswaList />} />
      <Route path="create" element={<SiswaForm />} />
      <Route path=":id" element={<SiswaDetail />} />
      <Route path=":id/edit" element={<SiswaForm />} />
    </Routes>
  )
}

export default Siswa