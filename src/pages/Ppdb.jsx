import { Routes, Route, Navigate } from 'react-router-dom'
import GelombangList from '../features/ppdb/pages/GelombangList'
import GelombangForm from '../features/ppdb/pages/GelombangForm'
import GelombangDetail from '../features/ppdb/pages/GelombangDetail'
import PendaftarList from '../features/ppdb/pages/PendaftarList'
import PendaftarForm from '../features/ppdb/pages/PendaftarForm'
import PendaftarDetail from '../features/ppdb/pages/PendaftarDetail'
import DokumenList from '../features/ppdb/pages/DokumenList'
import DokumenForm from '../features/ppdb/pages/DokumenForm'
import DokumenDetail from '../features/ppdb/pages/DokumenDetail'

const Ppdb = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="gelombang" replace />} />
      <Route path="gelombang" element={<GelombangList />} />
      <Route path="gelombang/create" element={<GelombangForm />} />
      <Route path="gelombang/:id" element={<GelombangDetail />} />
      <Route path="gelombang/:id/edit" element={<GelombangForm />} />
      <Route path="pendaftar" element={<PendaftarList />} />
      <Route path="pendaftar/create" element={<PendaftarForm />} />
      <Route path="pendaftar/:id" element={<PendaftarDetail />} />
      <Route path="pendaftar/:id/edit" element={<PendaftarForm />} />
      <Route path="dokumen" element={<DokumenList />} />
      <Route path="dokumen/create" element={<DokumenForm />} />
      <Route path="dokumen/:id" element={<DokumenDetail />} />
      <Route path="dokumen/:id/edit" element={<DokumenForm />} />
    </Routes>
  )
}

export default Ppdb