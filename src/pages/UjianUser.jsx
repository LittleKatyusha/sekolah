import { Routes, Route } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import UjianUserList from '../features/ujian-user/pages/UjianUserList'
import UjianUserForm from '../features/ujian-user/pages/UjianUserForm'
import UjianUserDetail from '../features/ujian-user/pages/UjianUserDetail'
import UjianUserMulai from '../features/ujian-user/pages/UjianUserMulai'
import UjianUserSiswaList from '../features/ujian-user/pages/UjianUserSiswaList'
import UjianUserSiswaDetail from '../features/ujian-user/pages/UjianUserSiswaDetail'

const UjianUser = () => {
  const { user } = useAuthStore()
  const isSiswa = user?.role === 'siswa'

  // Student view: card-based UI
  if (isSiswa) {
    return (
      <Routes>
        <Route path="/" element={<UjianUserSiswaList />} />
        <Route path=":id" element={<UjianUserSiswaDetail />} />
        <Route path=":id/mulai" element={<UjianUserMulai />} />
      </Routes>
    )
  }

  // Admin/Guru view: table-based UI
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