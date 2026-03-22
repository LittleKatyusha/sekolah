import { Navigate, Route, Routes } from 'react-router-dom'
import EwsDetail from '../features/ews/pages/EwsDetail'
import EwsList from '../features/ews/pages/EwsList'

const EWS = () => {
  return (
    <Routes>
      <Route path="/" element={<EwsList />} />
      <Route path=":id" element={<EwsDetail />} />
      <Route path="*" element={<Navigate to="/ews" replace />} />
    </Routes>
  )
}

export default EWS