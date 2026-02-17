import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Card from '../components/ui/Card'

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
        <ShieldAlert size={64} className="text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        You do not have permission to access this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}

export default Unauthorized