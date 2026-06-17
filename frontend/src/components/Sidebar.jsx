import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, LayoutDashboard, AlertTriangle, Cpu,
  Package, Warehouse, FileText
} from 'lucide-react'

export default function Sidebar({ activePage, isOpen, onClose }) {
  const { user } = useAuth()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.3)', zIndex: 99, display: 'none'
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Shield style={{ color: 'white', width: 18, height: 18 }} />
          </div>
          <div className="brand-text">
            <h2>SDRAS</h2>
            <span>Disaster Resource Allocation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Overview</div>
            <Link to="/dashboard" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`} onClick={onClose}>
              <span className="nav-icon"><LayoutDashboard style={{ width: 16, height: 16 }} /></span> Dashboard
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Operations</div>
            {user && (user.role === 'admin' || user.role === 'officer') && (
              <Link to="/disaster/new" className={`nav-link ${activePage === 'disaster_form' ? 'active' : ''}`} onClick={onClose}>
                <span className="nav-icon"><AlertTriangle style={{ width: 16, height: 16 }} /></span> Report Disaster
              </Link>
            )}
            <Link to="/predictions" className={`nav-link ${activePage === 'predictions' ? 'active' : ''}`} onClick={onClose}>
              <span className="nav-icon"><Cpu style={{ width: 16, height: 16 }} /></span> ML Predictions
            </Link>
            <Link to="/allocations" className={`nav-link ${activePage === 'allocations' ? 'active' : ''}`} onClick={onClose}>
              <span className="nav-icon"><Package style={{ width: 16, height: 16 }} /></span> Allocations
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Resources</div>
            <Link to="/warehouses" className={`nav-link ${activePage === 'warehouses' ? 'active' : ''}`} onClick={onClose}>
              <span className="nav-icon"><Warehouse style={{ width: 16, height: 16 }} /></span> Warehouses
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Intelligence</div>
            <Link to="/reports" className={`nav-link ${activePage === 'reports' ? 'active' : ''}`} onClick={onClose}>
              <span className="nav-icon"><FileText style={{ width: 16, height: 16 }} /></span> Decision Support
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user ? user.full_name[0] : '?'}</div>
            <div className="user-details">
              <div className="user-name">{user ? user.full_name : 'Guest'}</div>
              <div className="user-role">{user ? user.role : ''}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
