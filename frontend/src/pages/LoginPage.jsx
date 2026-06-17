import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import { Shield, Lock } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showFlash } = useFlash()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(username, password)
      showFlash(data.message || `Welcome back, ${data.user.full_name}!`, 'success')
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      showFlash(err.message || 'Invalid username or password.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">
              <Shield style={{ color: 'white', width: 28, height: 28 }} />
            </div>
            <h1>SDRAS</h1>
            <p>Smart Disaster Resource Allocation System</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text" id="username" className="form-control"
                placeholder="Enter your username" required autoFocus
                value={username} onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password" id="password" className="form-control"
                placeholder="Enter your password" required
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit" className="btn btn-primary btn-full btn-lg" id="login-btn"
              style={{ marginTop: '0.5rem' }} disabled={loading}
            >
              <Lock style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
