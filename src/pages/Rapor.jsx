import { Routes, Route } from 'react-router-dom'
import RaporList from '../features/rapor/pages/RaporList'
import RaporForm from '../features/rapor/pages/RaporForm'
import RaporDetail from '../features/rapor/pages/RaporDetail'

const Rapor = () => {
  return (
    <Routes>
      <Route path="/" element={<RaporList />} />
      <Route path="create" element={<RaporForm />} />
      <Route path=":id" element={<RaporDetail />} />
      <Route path=":id/edit" element={<RaporForm />} />
    </Routes>
  )
}

export default Rapor