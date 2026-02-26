import { Routes, Route } from 'react-router-dom'
import MateriList from '../features/materi/pages/MateriList'
import MateriForm from '../features/materi/pages/MateriForm'
import MateriDetail from '../features/materi/pages/MateriDetail'

const Materi = () => {
  return (
    <Routes>
      <Route path="/" element={<MateriList />} />
      <Route path="create" element={<MateriForm />} />
      <Route path=":id" element={<MateriDetail />} />
      <Route path=":id/edit" element={<MateriForm />} />
    </Routes>
  )
}

export default Materi