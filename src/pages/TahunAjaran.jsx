import { Routes, Route } from 'react-router-dom'
import TahunAjaranList from '../features/tahun-ajaran/pages/TahunAjaranList'
import TahunAjaranForm from '../features/tahun-ajaran/pages/TahunAjaranForm'
import TahunAjaranDetail from '../features/tahun-ajaran/pages/TahunAjaranDetail'

const TahunAjaran = () => {
  return (
    <Routes>
      <Route path="/" element={<TahunAjaranList />} />
      <Route path="create" element={<TahunAjaranForm />} />
      <Route path=":id" element={<TahunAjaranDetail />} />
      <Route path=":id/edit" element={<TahunAjaranForm />} />
    </Routes>
  )
}

export default TahunAjaran