import { Routes, Route } from 'react-router-dom'
import PermissionsList from '../features/roles/pages/PermissionsList'
import PermissionsForm from '../features/roles/pages/PermissionsForm'
import PermissionsDetail from '../features/roles/pages/PermissionsDetail'

const Permissions = () => {
  return (
    <Routes>
      <Route path="/" element={<PermissionsList />} />
      <Route path="create" element={<PermissionsForm />} />
      <Route path=":id" element={<PermissionsDetail />} />
      <Route path=":id/edit" element={<PermissionsForm />} />
    </Routes>
  )
}

export default Permissions