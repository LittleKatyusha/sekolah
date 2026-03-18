import { Routes, Route } from 'react-router-dom'
import KalenderAkademikCalendar from '../features/kalender-akademik/pages/KalenderAkademikCalendar'
import KalenderAkademikList from '../features/kalender-akademik/pages/KalenderAkademikList'
import KalenderAkademikForm from '../features/kalender-akademik/pages/KalenderAkademikForm'

const KalenderAkademik = () => {
  return (
    <Routes>
      <Route path="/" element={<KalenderAkademikCalendar />} />
      <Route path="list" element={<KalenderAkademikList />} />
      <Route path="create" element={<KalenderAkademikForm />} />
      <Route path=":id/edit" element={<KalenderAkademikForm />} />
    </Routes>
  )
}

export default KalenderAkademik