import { Routes, Route, Navigate } from 'react-router-dom'
import KriteriaList from '../features/spk/pages/KriteriaList'
import KriteriaForm from '../features/spk/pages/KriteriaForm'
import KriteriaDetail from '../features/spk/pages/KriteriaDetail'
import PenilaianList from '../features/spk/pages/PenilaianList'
import PenilaianForm from '../features/spk/pages/PenilaianForm'
import PenilaianDetail from '../features/spk/pages/PenilaianDetail'
import HasilList from '../features/spk/pages/HasilList'
import HasilDetail from '../features/spk/pages/HasilDetail'

const Spk = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="kriteria" replace />} />
      <Route path="kriteria" element={<KriteriaList />} />
      <Route path="kriteria/create" element={<KriteriaForm />} />
      <Route path="kriteria/:id" element={<KriteriaDetail />} />
      <Route path="kriteria/:id/edit" element={<KriteriaForm />} />
      <Route path="penilaian" element={<PenilaianList />} />
      <Route path="penilaian/create" element={<PenilaianForm />} />
      <Route path="penilaian/:id" element={<PenilaianDetail />} />
      <Route path="penilaian/:id/edit" element={<PenilaianForm />} />
      <Route path="hasil" element={<HasilList />} />
      <Route path="hasil/:id" element={<HasilDetail />} />
    </Routes>
  )
}

export default Spk