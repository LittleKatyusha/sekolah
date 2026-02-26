import { Routes, Route } from 'react-router-dom'
import GuruList from '../features/guru/pages/GuruList'
import GuruForm from '../features/guru/pages/GuruForm'
import GuruDetail from '../features/guru/pages/GuruDetail'

const Guru = () => {
  return (
    <Routes>
      <Route path="/" element={<GuruList />} />
      <Route path="create" element={<GuruForm />} />
      <Route path=":id" element={<GuruDetail />} />
      <Route path=":id/edit" element={<GuruForm />} />
    </Routes>
  )
}

export default Guru