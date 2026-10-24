import { Routes, Route } from 'react-router-dom'
import TugasList from '../features/tugas/pages/TugasList'
import TugasForm from '../features/tugas/pages/TugasForm'
import TugasDetail from '../features/tugas/pages/TugasDetail'
import TugasKelasGradeForm from '../features/tugas/pages/TugasKelasGradeForm'

const Tugas = () => {
  return (
    <Routes>
      <Route path="/" element={<TugasList />} />
      <Route path="create" element={<TugasForm />} />
      <Route path=":id" element={<TugasDetail />} />
      <Route path=":id/edit" element={<TugasForm />} />
      <Route path=":id/grade" element={<TugasKelasGradeForm />} />
      <Route path="grade" element={<TugasKelasGradeForm />} />
    </Routes>
  )
}

export default Tugas