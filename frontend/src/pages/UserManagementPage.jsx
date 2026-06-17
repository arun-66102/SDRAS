import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Users, Shield, Edit3, Warehouse, Mail, Check, X, ShieldAlert, UserPlus } from 'lucide-react'

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const { showFlash } = useFlash()
  const { user: currentUser } = useAuth()

  // Edit Modal State
  const [editModal, setEditModal] = useState({
    open: false,
    user: null,
    role: '',
    warehouseIds: []
  })
  const [createModal, setCreateModal] = useState({
    open: false,
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'ngo',
    warehouseIds: []
  })

  const loadData = async () => {
    try {
      const usersData = await api.get('/api/admin/users')
      const whData = await api.get('/api/warehouses')
      setUsers(usersData.users)
      setWarehouses(whData.warehouses)
      setLoading(false)
    } catch (err) {
      showFlash(err.message, 'error')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openEditModal = (u) => {
    setEditModal({
      open: true,
      user: u,
      role: u.role,
      warehouseIds: u.warehouses.map(w => w.id)
    })
  }

  const toggleWarehouseSelection = (whId) => {
    setEditModal(prev => {
      const idx = prev.warehouseIds.indexOf(whId)
      if (idx > -1) {
        return { ...prev, warehouseIds: prev.warehouseIds.filter(id => id !== whId) }
      } else {
        return { ...prev, warehouseIds: [...prev.warehouseIds, whId] }
      }
    })
  }

  const toggleNewUserWarehouse = (whId) => {
    setCreateModal(prev => {
      const idx = prev.warehouseIds.indexOf(whId)
      return {
        ...prev,
        warehouseIds: idx > -1
          ? prev.warehouseIds.filter(id => id !== whId)
          : [...prev.warehouseIds, whId]
      }
    })
  }

  const handleCreateUser = async () => {
    try {
      const result = await api.post('/api/admin/users', {
        full_name: createModal.full_name,
        username: createModal.username,
        email: createModal.email,
        password: createModal.password,
        role: createModal.role,
        warehouse_ids: createModal.role === 'officer' ? createModal.warehouseIds : []
      })
      showFlash(result.message, 'success')
      setCreateModal({
        open: false,
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 'ngo',
        warehouseIds: []
      })
      loadData()
    } catch (err) {
      showFlash(err.message, 'error')
    }
  }

  const handleSaveUser = async () => {
    try {
      const { user, role, warehouseIds } = editModal
      const result = await api.put(`/api/admin/users/${user.id}`, {
        role,
        warehouse_ids: role === 'officer' ? warehouseIds : []
      })
      showFlash(result.message, 'success')
      setEditModal(prev => ({ ...prev, open: false, user: null }))
      loadData()
    } catch (err) {
      showFlash(err.message, 'error')
    }
  }

  if (loading) {
    return (
      <Layout activePage="users" pageTitle="User Access Control">
        <LoadingSpinner />
      </Layout>
    )
  }

  // Count stats
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const officerCount = users.filter(u => u.role === 'officer').length
  const ngoCount = users.filter(u => u.role === 'ngo').length

  return (
    <Layout
      activePage="users"
      pageTitle={
        <>
          <Users style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> User Access Control
        </>
      }
    >
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Users" value={totalUsers} subtitle="Registered platform users" icon={Users} color="blue" />
        <StatCard label="Administrators" value={adminCount} subtitle="Full platform access" icon={ShieldAlert} color="rose" />
        <StatCard label="Warehouse Officers" value={officerCount} subtitle="Regional depot management" icon={Warehouse} color="emerald" />
        <StatCard label="Disaster Reporters" value={ngoCount} subtitle="User / NGO coordinator role" icon={Shield} color="amber" />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(prev => ({ ...prev, open: true }))}>
          <UserPlus style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
          Create User
        </button>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h3>Registered Users & Permissions</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Assigned Depot(s)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="fw-600">{u.full_name}</td>
                    <td><code>{u.username}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                        {u.email}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-rose' :
                        u.role === 'officer' ? 'badge-emerald' : 'badge-amber'
                      }`}>
                        {u.role_label || u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {u.role === 'officer' ? (
                        u.warehouses.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {u.warehouses.map(w => (
                              <span key={w.id} className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                                {w.warehouse_id} - {w.warehouse_name.split(' — ')[1] || w.warehouse_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>None Assigned</span>
                        )
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>N/A (Non-Officer)</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={u.id === currentUser?.id}
                        onClick={() => openEditModal(u)}
                        title={u.id === currentUser?.id ? "Cannot modify your own permissions" : "Manage User Permissions"}
                      >
                        <Edit3 style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {createModal.open && (
        <div className="modal-backdrop open" onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-content glass" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Platform User</h3>
              <button className="modal-close" onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={createModal.full_name} onChange={e => setCreateModal(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input className="form-control" value={createModal.username} onChange={e => setCreateModal(p => ({ ...p, username: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" value={createModal.email} onChange={e => setCreateModal(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Temporary Password</label>
                  <input type="password" className="form-control" value={createModal.password} onChange={e => setCreateModal(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label className="fw-600" style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Role</label>
                <select
                  className="form-control"
                  value={createModal.role}
                  onChange={e => setCreateModal(prev => ({ ...prev, role: e.target.value, warehouseIds: e.target.value === 'officer' ? prev.warehouseIds : [] }))}
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="officer">Regional Warehouse Officer (Limited Access)</option>
                  <option value="ngo">Disaster Reporter / NGO Coordinator</option>
                </select>
              </div>

              {createModal.role === 'officer' && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="fw-600" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Warehouse Assignments <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(Select all that apply)</span>
                  </label>
                  <div
                    style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    {warehouses.map(wh => {
                      const isSelected = createModal.warehouseIds.includes(wh.id)
                      return (
                        <div
                          key={wh.id}
                          onClick={() => toggleNewUserWarehouse(wh.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                            marginBottom: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ pointerEvents: 'none' }} />
                          <span style={{ fontSize: '0.85rem' }}>
                            <strong>{wh.warehouse_id}</strong> - {wh.warehouse_name} ({wh.district}, {wh.state})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}>
                <X style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateUser}>
                <Check style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role / Assignments Modal */}
      {editModal.open && editModal.user && (
        <div className="modal-backdrop open" onClick={() => setEditModal(prev => ({ ...prev, open: false, user: null }))}>
          <div className="modal-content glass" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Access for {editModal.user.full_name}</h3>
              <button className="modal-close" onClick={() => setEditModal(prev => ({ ...prev, open: false, user: null }))}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="fw-600" style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Role</label>
                <select
                  className="form-control"
                  value={editModal.role}
                  onChange={e => setEditModal(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="officer">Regional Warehouse Officer (Limited Access)</option>
                  <option value="ngo">Disaster Reporter / NGO Coordinator</option>
                </select>
              </div>

              {editModal.role === 'officer' && (
                <div>
                  <label className="fw-600" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Warehouse Assignments <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(Select all that apply)</span>
                  </label>
                  <div
                    style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    {warehouses.map(wh => {
                      const isSelected = editModal.warehouseIds.includes(wh.id)
                      return (
                        <div
                          key={wh.id}
                          onClick={() => toggleWarehouseSelection(wh.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                            marginBottom: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by onClick of container
                            style={{ pointerEvents: 'none' }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>
                            <strong>{wh.warehouse_id}</strong> — {wh.warehouse_name} ({wh.district}, {wh.state})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditModal(prev => ({ ...prev, open: false, user: null }))}>
                <X style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveUser}>
                <Check style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
