import { Navigate, Route, Routes } from 'react-router-dom'
import WahaDashboard from '../features/waha/pages/WahaDashboard'

const Waha = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="session" replace />} />
      <Route path="session" element={<WahaDashboard defaultTab="session" />} />
      <Route path="send" element={<WahaDashboard defaultTab="send" />} />
      <Route path="*" element={<Navigate to="session" replace />} />
    </Routes>
  )
}

export default Waha