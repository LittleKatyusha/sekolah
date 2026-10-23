import { Routes, Route } from 'react-router-dom'
import NilaiList from '../features/nilai/pages/NilaiList'
import NilaiForm from '../features/nilai/pages/NilaiForm'
import NilaiDetail from '../features/nilai/pages/NilaiDetail'
import NilaiKelasForm from '../features/nilai/pages/NilaiKelasForm'

const Nilai = () => {
  return (
    <Routes>
      <Route path="/" element={<NilaiList />} />
      <Route path="create" element={<NilaiForm />} />
      <Route path="kelas" element={<NilaiKelasForm />} />
      <Route path="bulk" element={<NilaiKelasForm />} />
      <Route path=":id" element={<NilaiDetail />} />
      <Route path=":id/edit" element={<NilaiForm />} />
    </Routes>
  )
}

export default Nilai