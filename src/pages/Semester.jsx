import { Routes, Route } from 'react-router-dom'
import SemesterList from '../features/semester/pages/SemesterList'
import SemesterForm from '../features/semester/pages/SemesterForm'
import SemesterDetail from '../features/semester/pages/SemesterDetail'

const Semester = () => {
  return (
    <Routes>
      <Route path="/" element={<SemesterList />} />
      <Route path="create" element={<SemesterForm />} />
      <Route path=":id" element={<SemesterDetail />} />
      <Route path=":id/edit" element={<SemesterForm />} />
    </Routes>
  )
}

export default Semester