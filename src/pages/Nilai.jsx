import { Routes, Route } from 'react-router-dom'
import NilaiList from '../features/nilai/pages/NilaiList'
import NilaiForm from '../features/nilai/pages/NilaiForm'
import NilaiDetail from '../features/nilai/pages/NilaiDetail'

const Nilai = () => {
  return (
    <Routes>
      <Route path="/" element={<NilaiList />} />
      <Route path="create" element={<NilaiForm />} />
      <Route path=":id" element={<NilaiDetail />} />
      <Route path=":id/edit" element={<NilaiForm />} />
    </Routes>
  )
}

export default Nilai