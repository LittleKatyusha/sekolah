import { Routes, Route } from 'react-router-dom'
import JadwalPelajaranList from '../features/jadwal-pelajaran/pages/JadwalPelajaranList'
import JadwalPelajaranForm from '../features/jadwal-pelajaran/pages/JadwalPelajaranForm'
import JadwalPelajaranDetail from '../features/jadwal-pelajaran/pages/JadwalPelajaranDetail'

const JadwalPelajaran = () => {
  return (
    <Routes>
      <Route path="/" element={<JadwalPelajaranList />} />
      <Route path="create" element={<JadwalPelajaranForm />} />
      <Route path=":id" element={<JadwalPelajaranDetail />} />
      <Route path=":id/edit" element={<JadwalPelajaranForm />} />
    </Routes>
  )
}

export default JadwalPelajaran