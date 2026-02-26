import { Routes, Route } from 'react-router-dom'
import KelasList from '../features/kelas/pages/KelasList'
import KelasForm from '../features/kelas/pages/KelasForm'
import KelasDetail from '../features/kelas/pages/KelasDetail'

const Kelas = () => {
  return (
    <Routes>
      <Route path="/" element={<KelasList />} />
      <Route path="create" element={<KelasForm />} />
      <Route path=":id" element={<KelasDetail />} />
      <Route path=":id/edit" element={<KelasForm />} />
    </Routes>
  )
}

export default Kelas