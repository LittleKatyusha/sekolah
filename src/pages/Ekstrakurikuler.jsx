import { Routes, Route } from 'react-router-dom'
import EkstrakurikulerList from '../features/ekstrakurikuler/pages/EkstrakurikulerList'
import EkstrakurikulerForm from '../features/ekstrakurikuler/pages/EkstrakurikulerForm'
import EkstrakurikulerDetail from '../features/ekstrakurikuler/pages/EkstrakurikulerDetail'
import EksSiswaList from '../features/ekstrakurikuler/pages/EksSiswaList'
import EksSiswaForm from '../features/ekstrakurikuler/pages/EksSiswaForm'
import EksSiswaDetail from '../features/ekstrakurikuler/pages/EksSiswaDetail'

const Ekstrakurikuler = () => {
  return (
    <Routes>
      <Route path="/" element={<EkstrakurikulerList />} />
      <Route path="create" element={<EkstrakurikulerForm />} />
      <Route path=":id" element={<EkstrakurikulerDetail />} />
      <Route path=":id/edit" element={<EkstrakurikulerForm />} />
      <Route path="siswa" element={<EksSiswaList />} />
      <Route path="siswa/create" element={<EksSiswaForm />} />
      <Route path="siswa/:id" element={<EksSiswaDetail />} />
      <Route path="siswa/:id/edit" element={<EksSiswaForm />} />
    </Routes>
  )
}

export default Ekstrakurikuler