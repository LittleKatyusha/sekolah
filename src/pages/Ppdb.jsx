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
import PortalPpdb from '../features/ppdb/pages/PortalPpdb'
// Smart Selection
import KriteriaSeleksiList from '../features/ppdb/pages/KriteriaSeleksiList'
import KriteriaSeleksiForm from '../features/ppdb/pages/KriteriaSeleksiForm'
import KuotaJurusanList from '../features/ppdb/pages/KuotaJurusanList'
import KuotaJurusanForm from '../features/ppdb/pages/KuotaJurusanForm'
import SeleksiEngine from '../features/ppdb/pages/SeleksiEngine'
import HasilSeleksiList from '../features/ppdb/pages/HasilSeleksiList'
// Nilai Rapor
import NilaiRaporList from '../features/ppdb/pages/NilaiRaporList'
import NilaiRaporForm from '../features/ppdb/pages/NilaiRaporForm'
import NilaiRaporBulkForm from '../features/ppdb/pages/NilaiRaporBulkForm'

const Ppdb = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/ppdb/gelombang" replace />} />

      {/* ── Gelombang ── */}
      <Route path="gelombang" element={<GelombangList />} />
      <Route path="gelombang/create" element={<GelombangForm />} />
      <Route path="gelombang/:id" element={<GelombangDetail />} />
      <Route path="gelombang/:id/edit" element={<GelombangForm />} />

      {/* ── Smart Selection: Kriteria ── */}
      <Route path="gelombang/:gelombangId/kriteria" element={<KriteriaSeleksiList />} />
      <Route path="gelombang/:gelombangId/kriteria/create" element={<KriteriaSeleksiForm />} />
      <Route path="gelombang/:gelombangId/kriteria/:kriteriaId/edit" element={<KriteriaSeleksiForm />} />

      {/* ── Smart Selection: Kuota Jurusan ── */}
      <Route path="gelombang/:gelombangId/kuota" element={<KuotaJurusanList />} />
      <Route path="gelombang/:gelombangId/kuota/create" element={<KuotaJurusanForm />} />
      <Route path="gelombang/:gelombangId/kuota/:kuotaId/edit" element={<KuotaJurusanForm />} />

      {/* ── Smart Selection: Engine & Hasil ── */}
      <Route path="gelombang/:gelombangId/seleksi" element={<SeleksiEngine />} />
      <Route path="gelombang/:gelombangId/hasil-seleksi" element={<HasilSeleksiList />} />

      {/* ── Pendaftaran ── */}
      <Route path="pendaftaran" element={<PendaftarList />} />
      <Route path="pendaftaran/create" element={<PendaftarForm />} />
      <Route path="pendaftaran/:id" element={<PendaftarDetail />} />
      <Route path="pendaftaran/:id/edit" element={<PendaftarForm />} />

      {/* backward compatibility */}
      <Route path="pendaftar" element={<PendaftarList />} />
      <Route path="pendaftar/create" element={<PendaftarForm />} />
      <Route path="pendaftar/:id" element={<PendaftarDetail />} />
      <Route path="pendaftar/:id/edit" element={<PendaftarForm />} />

      {/* ── Portal publik ── */}
      <Route path="portal" element={<PortalPpdb />} />

      {/* ── Dokumen ── */}
      <Route path="dokumen" element={<DokumenList />} />
      <Route path="dokumen/create" element={<DokumenForm />} />
      <Route path="dokumen/:id" element={<DokumenDetail />} />
      <Route path="dokumen/:id/edit" element={<DokumenForm />} />

      {/* ── Nilai Rapor ── */}
      <Route path="nilai-rapor" element={<NilaiRaporList />} />
      <Route path="nilai-rapor/create" element={<NilaiRaporForm />} />
      <Route path="nilai-rapor/bulk" element={<NilaiRaporBulkForm />} />
      <Route path="nilai-rapor/:id/edit" element={<NilaiRaporForm />} />

      <Route path="*" element={<Navigate to="/ppdb/gelombang" replace />} />
    </Routes>
  )
}

export default Ppdb
