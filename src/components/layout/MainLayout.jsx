import { lazy, Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

// Lazy-load ChatWidget so react-markdown and chatbotService are not parsed
// on every authenticated page load — they are only needed when the widget is opened.
const ChatWidget = lazy(() => import('../../features/chatbot/components/ChatWidget'))

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  )
}

export default MainLayout
