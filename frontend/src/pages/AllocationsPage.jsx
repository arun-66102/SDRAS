import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumberFull } from '../utils/formatNumber'
import { Package, CheckCircle, Truck, Clock, FileText } from 'lucide-react'

export default function AllocationsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showFlash } = useFlash()

  useEffect(() => {
    api.get('/api/allocations')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  if (loading) return <Layout activePage="allocations" pageTitle="Resource Allocations"><LoadingSpinner /></Layout>

  const { allocations, stats } = data

  return (
    <Layout
      activePage="allocations"
      pageTitle={<><Package style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Resource Allocations</>}
    >
      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Allocations" value={stats.total} icon={Package} color="blue" />
        <StatCard label="Fully Allocated" value={stats.allocated} icon={CheckCircle} color="emerald" />
        <StatCard label="Dispatched" value={stats.dispatched} icon={Truck} color="amber" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="rose" />
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3><FileText style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Allocation Records</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table" id="allocations-table">
              <thead>
                <tr>
                  <th>ID</th><th>Disaster</th><th>Warehouse</th><th>Distance</th>
                  <th>Food</th><th>Medical</th><th>Water</th><th>Clothing</th>
                  <th>Priority</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allocations && allocations.length > 0 ? allocations.map(a => (
                  <tr key={a.id}>
                    <td className="fw-600">#{a.id}</td>
                    <td>
                      {a.disaster ? (
                        <>
                          <span className="badge badge-blue">{a.disaster.disaster_type}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.15rem' }}>{a.disaster.district}</span>
                        </>
                      ) : `#${a.disaster_id}`}
                    </td>
                    <td>
                      {a.warehouse ? (
                        <>
                          {a.warehouse.warehouse_id}
                          <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.15rem' }}>{a.warehouse.district}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td>{a.distance_km.toFixed(1)} km</td>
                    <td>{formatNumberFull(a.food_allocated)}</td>
                    <td>{formatNumberFull(a.medical_allocated)}</td>
                    <td>{formatNumberFull(a.water_allocated)}</td>
                    <td>{formatNumberFull(a.clothing_allocated)}</td>
                    <td>
                      <span className={`fw-700 ${a.priority <= 3 ? 'text-rose' : a.priority <= 6 ? 'text-amber' : 'text-emerald'}`}>
                        P{a.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'Allocated' ? 'badge-emerald' : a.status === 'Dispatched' ? 'badge-blue' : a.status === 'Delivered' ? 'badge-purple' : 'badge-amber'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {a.created_at || '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="11">
                      <div className="empty-state">
                        <div className="empty-icon"><Package style={{ width: 48, height: 48, color: 'var(--text-muted)' }} /></div>
                        <h3>No Allocations Yet</h3>
                        <p>Allocate resources from the Dashboard or Disaster reports.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
