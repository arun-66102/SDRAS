import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import { Shield, Lock, Crown, Award, Users } from 'lucide-react'

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
      showFlash(`Welcome back, ${data.user.full_name}!`, 'success')
      navigate('/dashboard')
    } catch (err) {
      showFlash(err.message || 'Invalid username or password.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fillLogin = (u, p) => {
    setUsername(u)
    setPassword(p)
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

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
              Demo Credentials
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => fillLogin('admin', 'admin123')} style={{ fontSize: '0.7rem' }}>
                <Crown style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> Admin
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => fillLogin('officer', 'officer123')} style={{ fontSize: '0.7rem' }}>
                <Award style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> Officer
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => fillLogin('ngo', 'ngo123')} style={{ fontSize: '0.7rem' }}>
                <Users style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> NGO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
