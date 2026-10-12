import { Routes, Route } from 'react-router-dom'
import EkstrakurikulerList from '../features/ekstrakurikuler/pages/EkstrakurikulerList'
import EkstrakurikulerForm from '../features/ekstrakurikuler/pages/EkstrakurikulerForm'
import EkstrakurikulerDetail from '../features/ekstrakurikuler/pages/EkstrakurikulerDetail'
import EksSiswaList from '../features/ekstrakurikuler/pages/EksSiswaList'
import EksSiswaForm from '../features/ekstrakurikuler/pages/EksSiswaForm'
import EksSiswaDetail from '../features/ekstrakurikuler/pages/EksSiswaDetail'
import EksKegiatanList from '../features/ekstrakurikuler/pages/EksKegiatanList'
import EksKegiatanForm from '../features/ekstrakurikuler/pages/EksKegiatanForm'
import EksKegiatanDetail from '../features/ekstrakurikuler/pages/EksKegiatanDetail'

const Ekstrakurikuler = () => {
  return (
    <Routes>
      <Route path="/" element={<EkstrakurikulerList />} />
      <Route path="create" element={<EkstrakurikulerForm />} />

      {/* Kegiatan routes — must come before :id wildcard */}
      <Route path="kegiatan" element={<EksKegiatanList />} />
      <Route path="kegiatan/create" element={<EksKegiatanForm />} />
      <Route path="kegiatan/:id" element={<EksKegiatanDetail />} />
      <Route path="kegiatan/:id/edit" element={<EksKegiatanForm />} />

      {/* Pendaftaran routes — must come before :id wildcard */}
      <Route path="pendaftaran" element={<EksSiswaList />} />
      <Route path="pendaftaran/create" element={<EksSiswaForm />} />
      <Route path="pendaftaran/:id" element={<EksSiswaDetail />} />
      <Route path="pendaftaran/:id/edit" element={<EksSiswaForm />} />

      {/* Ekstrakurikuler detail — must be last */}
      <Route path=":id" element={<EkstrakurikulerDetail />} />
      <Route path=":id/edit" element={<EkstrakurikulerForm />} />
    </Routes>
  )
}

export default Ekstrakurikuler