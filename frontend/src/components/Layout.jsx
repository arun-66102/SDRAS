import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import FlashMessages from './FlashMessages'

export default function Layout({ children, activePage, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header pageTitle={pageTitle} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <FlashMessages />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
