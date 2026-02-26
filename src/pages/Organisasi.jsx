import { Routes, Route } from 'react-router-dom'
import OrganisasiList from '../features/organisasi/pages/OrganisasiList'
import OrganisasiForm from '../features/organisasi/pages/OrganisasiForm'
import OrganisasiDetail from '../features/organisasi/pages/OrganisasiDetail'
import AnggotaList from '../features/organisasi/pages/AnggotaList'
import AnggotaForm from '../features/organisasi/pages/AnggotaForm'
import AnggotaDetail from '../features/organisasi/pages/AnggotaDetail'

const Organisasi = () => {
  return (
    <Routes>
      <Route path="/" element={<OrganisasiList />} />
      <Route path="create" element={<OrganisasiForm />} />
      <Route path=":id" element={<OrganisasiDetail />} />
      <Route path=":id/edit" element={<OrganisasiForm />} />
      <Route path="anggota" element={<AnggotaList />} />
      <Route path="anggota/create" element={<AnggotaForm />} />
      <Route path="anggota/:id" element={<AnggotaDetail />} />
      <Route path="anggota/:id/edit" element={<AnggotaForm />} />
    </Routes>
  )
}

export default Organisasi