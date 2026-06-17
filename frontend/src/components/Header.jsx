import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useFlash } from '../context/FlashContext'

export default function Header({ pageTitle, onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const handleLogout = async () => {
    try {
      await logout()
      showFlash('You have been logged out.', 'info')
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar}>☰</button>
        <h1>{pageTitle}</h1>
      </div>
      <div className="header-right">
        {user && (
          <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
        )}
      </div>
    </header>
  )
}
