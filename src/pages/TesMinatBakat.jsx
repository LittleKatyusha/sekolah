import { Navigate, Route, Routes } from 'react-router-dom'
import TesMinatBakatDashboard from '../features/tes-minat-bakat/components/TesMinatBakatDashboard'
import TesMinatBakatDetailPage from '../features/tes-minat-bakat/components/TesMinatBakatDetailPage'
import TesMinatBakatFormPage from '../features/tes-minat-bakat/components/TesMinatBakatFormPage'
import TesMinatBakatListPage from '../features/tes-minat-bakat/components/TesMinatBakatListPage'

const TesMinatBakat = () => {
  return (
    <Routes>
      <Route path="/" element={<TesMinatBakatDashboard />} />

      <Route path="tes" element={<TesMinatBakatListPage resourceKey="tes" />} />
      <Route path="tes/create" element={<TesMinatBakatFormPage resourceKey="tes" />} />
      <Route path="tes/:id" element={<TesMinatBakatDetailPage resourceKey="tes" />} />
      <Route path="tes/:id/edit" element={<TesMinatBakatFormPage resourceKey="tes" />} />

      <Route path="aspek" element={<TesMinatBakatListPage resourceKey="aspek" />} />
      <Route path="aspek/create" element={<TesMinatBakatFormPage resourceKey="aspek" />} />
      <Route path="aspek/:id" element={<TesMinatBakatDetailPage resourceKey="aspek" />} />
      <Route path="aspek/:id/edit" element={<TesMinatBakatFormPage resourceKey="aspek" />} />

      <Route path="pertanyaan" element={<TesMinatBakatListPage resourceKey="pertanyaan" />} />
      <Route path="pertanyaan/create" element={<TesMinatBakatFormPage resourceKey="pertanyaan" />} />
      <Route path="pertanyaan/:id" element={<TesMinatBakatDetailPage resourceKey="pertanyaan" />} />
      <Route path="pertanyaan/:id/edit" element={<TesMinatBakatFormPage resourceKey="pertanyaan" />} />

      <Route path="peserta" element={<TesMinatBakatListPage resourceKey="peserta" />} />
      <Route path="peserta/create" element={<TesMinatBakatFormPage resourceKey="peserta" />} />
      <Route path="peserta/:id" element={<TesMinatBakatDetailPage resourceKey="peserta" />} />
      <Route path="peserta/:id/edit" element={<TesMinatBakatFormPage resourceKey="peserta" />} />

      <Route path="jawaban" element={<TesMinatBakatListPage resourceKey="jawaban" />} />
      <Route path="jawaban/create" element={<TesMinatBakatFormPage resourceKey="jawaban" />} />
      <Route path="jawaban/:id" element={<TesMinatBakatDetailPage resourceKey="jawaban" />} />
      <Route path="jawaban/:id/edit" element={<TesMinatBakatFormPage resourceKey="jawaban" />} />

      <Route path="hasil" element={<TesMinatBakatListPage resourceKey="hasil" />} />
      <Route path="hasil/create" element={<TesMinatBakatFormPage resourceKey="hasil" />} />
      <Route path="hasil/:id" element={<TesMinatBakatDetailPage resourceKey="hasil" />} />
      <Route path="hasil/:id/edit" element={<TesMinatBakatFormPage resourceKey="hasil" />} />

      <Route path="*" element={<Navigate to="/akademik/tes-minat-bakat" replace />} />
    </Routes>
  )
}

export default TesMinatBakat