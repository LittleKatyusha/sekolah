import { Routes, Route } from 'react-router-dom'
import RolesList from '../features/roles/pages/RolesList'
import RolesForm from '../features/roles/pages/RolesForm'
import RolesDetail from '../features/roles/pages/RolesDetail'

const Roles = () => {
  return (
    <Routes>
      <Route path="/" element={<RolesList />} />
      <Route path="create" element={<RolesForm />} />
      <Route path=":id" element={<RolesDetail />} />
      <Route path=":id/edit" element={<RolesForm />} />
    </Routes>
  )
}

export default Roles