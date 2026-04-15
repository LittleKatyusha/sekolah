import { Routes, Route } from 'react-router-dom'
import OrganisasiList from '../features/organisasi/pages/OrganisasiList'
import OrganisasiForm from '../features/organisasi/pages/OrganisasiForm'
import OrganisasiDetail from '../features/organisasi/pages/OrganisasiDetail'
import AnggotaList from '../features/organisasi/pages/AnggotaList'
import AnggotaForm from '../features/organisasi/pages/AnggotaForm'
import AnggotaDetail from '../features/organisasi/pages/AnggotaDetail'
import JabatanList from '../features/organisasi/pages/JabatanList'
import JabatanForm from '../features/organisasi/pages/JabatanForm'
import JabatanDetail from '../features/organisasi/pages/JabatanDetail'

const Organisasi = () => {
  return (
    <Routes>
      <Route path="/" element={<OrganisasiList />} />
      <Route path="create" element={<OrganisasiForm />} />

      {/* Jabatan routes — must come before :id wildcard */}
      <Route path="jabatan" element={<JabatanList />} />
      <Route path="jabatan/create" element={<JabatanForm />} />
      <Route path="jabatan/:id" element={<JabatanDetail />} />
      <Route path="jabatan/:id/edit" element={<JabatanForm />} />

      {/* Anggota routes — must come before :id wildcard */}
      <Route path="anggota" element={<AnggotaList />} />
      <Route path="anggota/create" element={<AnggotaForm />} />
      <Route path="anggota/:id" element={<AnggotaDetail />} />
      <Route path="anggota/:id/edit" element={<AnggotaForm />} />

      {/* Organisasi detail — must be last */}
      <Route path=":id" element={<OrganisasiDetail />} />
      <Route path=":id/edit" element={<OrganisasiForm />} />
    </Routes>
  )
}

export default Organisasi