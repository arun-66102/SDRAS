import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  AlertTriangle, Package, ShieldAlert, UserPlus,
  Users, Warehouse, Activity
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showFlash } = useFlash()

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <Layout activePage="admin_dashboard" pageTitle="Admin Dashboard">
        <LoadingSpinner />
      </Layout>
    )
  }

  const { stats, recent_users, low_stock, recent_disasters } = data

  return (
    <Layout
      activePage="admin_dashboard"
      pageTitle={<><ShieldAlert style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Admin Dashboard</>}
    >
      <div className="stats-grid">
        <StatCard label="Total Users" value={stats.total_users} subtitle="Registered operators" icon={Users} color="blue" />
        <StatCard label="Administrators" value={stats.admins} subtitle="Full system access" icon={ShieldAlert} color="rose" />
        <StatCard label="Warehouse Officers" value={stats.officers} subtitle="Scoped depot access" icon={Warehouse} color="emerald" />
        <StatCard label="Disaster Reporters" value={stats.reporters} subtitle="NGO/user reporting role" icon={UserPlus} color="amber" />
        <StatCard label="Active Disasters" value={stats.active_disasters} subtitle="Awaiting response" icon={AlertTriangle} color="purple" />
        <StatCard label="Low Stock Depots" value={stats.low_stock_warehouses} subtitle="Below reserve threshold" icon={Package} color="cyan" />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Link to="/admin/users" className="btn btn-primary btn-sm">
          <UserPlus style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
          Manage Users
        </Link>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3><Users style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Recent Users</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Assigned Depots</th></tr>
                </thead>
                <tbody>
                  {recent_users.length > 0 ? recent_users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-600">{u.full_name}</div>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{u.username}</span>
                      </td>
                      <td><span className={`badge ${roleBadge(u.role)}`}>{u.role_label}</span></td>
                      <td>
                        {u.role === 'officer'
                          ? `${u.warehouses.length} assigned`
                          : u.role === 'admin' ? 'All depots' : 'N/A'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-muted">No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><Activity style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Recent Disaster Reports</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Type</th><th>Location</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recent_disasters.length > 0 ? recent_disasters.map(d => (
                    <tr key={d.id}>
                      <td className="fw-600">#{d.id}</td>
                      <td><span className="badge badge-blue">{d.disaster_type}</span></td>
                      <td>{d.district}, {d.state}</td>
                      <td><span className="badge badge-amber">{d.status}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-muted">No disaster reports yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3><Package style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Warehouses Below Reserve Threshold</h3>
          <Link to="/warehouses" className="btn btn-outline btn-sm">Open Inventory</Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Warehouse</th><th>Location</th><th>Food</th><th>Medical</th><th>Water</th><th>Clothing</th></tr>
              </thead>
              <tbody>
                {low_stock.length > 0 ? low_stock.map(w => (
                  <tr key={w.id}>
                    <td className="fw-600">{w.warehouse_id} - {w.warehouse_name}</td>
                    <td>{w.district}, {w.state}</td>
                    <td>{w.food_stock}</td>
                    <td>{w.medical_stock}</td>
                    <td>{w.water_stock}</td>
                    <td>{w.clothing_stock}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-muted">All warehouses are above their reserve thresholds.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function roleBadge(role) {
  if (role === 'admin') return 'badge-rose'
  if (role === 'officer') return 'badge-emerald'
  return 'badge-amber'
}
