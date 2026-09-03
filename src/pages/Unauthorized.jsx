import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const Unauthorized = () => {
  useEffect(() => {
    useAuthStore.getState().logout()
  }, [])

  return <Navigate to="/login" replace />
}

export default Unauthorized
