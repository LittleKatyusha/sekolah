import { Routes, Route } from 'react-router-dom'
import KalenderAkademikList from '../features/kalender-akademik/pages/KalenderAkademikList'
import KalenderAkademikForm from '../features/kalender-akademik/pages/KalenderAkademikForm'
import KalenderAkademikDetail from '../features/kalender-akademik/pages/KalenderAkademikDetail'

const KalenderAkademik = () => {
  return (
    <Routes>
      <Route path="/" element={<KalenderAkademikList />} />
      <Route path="create" element={<KalenderAkademikForm />} />
      <Route path=":id" element={<KalenderAkademikDetail />} />
      <Route path=":id/edit" element={<KalenderAkademikForm />} />
    </Routes>
  )
}

export default KalenderAkademik