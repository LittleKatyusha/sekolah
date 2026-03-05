import { Routes, Route } from 'react-router-dom'
import RolePermissionsList from '../features/roles/pages/RolePermissionsList'
import RolePermissionsForm from '../features/roles/pages/RolePermissionsForm'
import RolePermissionsDetail from '../features/roles/pages/RolePermissionsDetail'

const RolePermissions = () => {
  return (
    <Routes>
      <Route path="/" element={<RolePermissionsList />} />
      <Route path="create" element={<RolePermissionsForm />} />
      <Route path=":id" element={<RolePermissionsDetail />} />
      <Route path=":id/edit" element={<RolePermissionsForm />} />
    </Routes>
  )
}

export default RolePermissions