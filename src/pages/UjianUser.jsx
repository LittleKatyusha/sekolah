import { Routes, Route } from 'react-router-dom'
import UjianUserList from '../features/ujian-user/pages/UjianUserList'
import UjianUserForm from '../features/ujian-user/pages/UjianUserForm'
import UjianUserDetail from '../features/ujian-user/pages/UjianUserDetail'
import UjianUserMulai from '../features/ujian-user/pages/UjianUserMulai'

const UjianUser = () => {
  return (
    <Routes>
      <Route path="/" element={<UjianUserList />} />
      <Route path="create" element={<UjianUserForm />} />
      <Route path=":id" element={<UjianUserDetail />} />
      <Route path=":id/edit" element={<UjianUserForm />} />
      <Route path=":id/mulai" element={<UjianUserMulai />} />
    </Routes>
  )
}

export default UjianUser