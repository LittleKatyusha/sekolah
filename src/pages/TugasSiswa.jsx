import { Routes, Route } from 'react-router-dom'
import TugasSiswaList from '../features/tugas/pages/TugasSiswaList'
import TugasSiswaForm from '../features/tugas/pages/TugasSiswaForm'
import TugasSiswaDetail from '../features/tugas/pages/TugasSiswaDetail'

const TugasSiswa = () => {
  return (
    <Routes>
      <Route path="/" element={<TugasSiswaList />} />
      <Route path="create" element={<TugasSiswaForm />} />
      <Route path=":id" element={<TugasSiswaDetail />} />
      <Route path=":id/edit" element={<TugasSiswaForm />} />
    </Routes>
  )
}

export default TugasSiswa