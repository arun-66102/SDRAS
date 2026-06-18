import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import { api } from '../api/client'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumber, formatNumberFull } from '../utils/formatNumber'
import {
  AlertTriangle, Bell, Warehouse, Users, Package, Cpu,
  Map, BarChart2, Target, FileText
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale,
  LinearScale, Tooltip, Legend
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// Chart defaults
ChartJS.defaults.color = '#5c4c4c'
ChartJS.defaults.borderColor = 'rgba(61,46,46,0.06)'
ChartJS.defaults.font.family = "'Inter', sans-serif"
ChartJS.defaults.font.size = 12

const warehouseIcon = L.divIcon({
  className: 'custom-warehouse-icon',
  html: '<div style="background:#f48296;width:12px;height:12px;border-radius:3px;border:2px solid #fff;box-shadow:0 0 6px rgba(244,130,150,0.5)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function getSeverityColor(sev) {
  if (sev >= 8) return '#e56b8f' // deep rose pink
  if (sev >= 6) return '#f4a261' // peach / soft orange
  if (sev >= 4) return '#e9c46a' // pastel yellow
  return '#88b293' // pale green
}

function getDisasterBadgeClass(type) {
  const map = { Flood: 'badge-blue', Cyclone: 'badge-purple', Earthquake: 'badge-amber', Fire: 'badge-rose', Tsunami: 'badge-cyan' }
  return map[type] || 'badge-emerald'
}

function getStatusBadgeClass(status) {
  const map = { Active: 'badge-rose', Allocated: 'badge-emerald', Resolved: 'badge-blue' }
  return map[status] || 'badge-amber'
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ open: false, disasterId: null })
  const { user } = useAuth()
  const { showFlash } = useFlash()

  useEffect(() => {
    api.get('/api/dashboard')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  const handleAllocate = (disasterId) => {
    setConfirmModal({ open: true, disasterId })
  }

  const doAllocate = async () => {
    const disasterId = confirmModal.disasterId
    setConfirmModal({ open: false, disasterId: null })
    try {
      const result = await api.post('/api/allocate', { disaster_id: disasterId })
      showFlash(result.message || 'Resources allocated successfully!', 'success')
      // Reload data
      const d = await api.get('/api/dashboard')
      setData(d)
    } catch (err) {
      showFlash(err.message, 'error')
    }
  }

  if (loading) return <Layout activePage="dashboard" pageTitle="Dashboard"><LoadingSpinner /></Layout>

  const { stats, chart_data, disasters, warehouses, recent_disasters } = data

  return (
    <Layout activePage="dashboard" pageTitle="Dashboard">
      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard label="Total Disasters" value={stats.total_disasters} subtitle="Active incidents tracked" icon={AlertTriangle} color="blue" />
        <StatCard label="Critical (Sev ≥ 8)" value={stats.critical_count} subtitle="Require immediate response" icon={Bell} color="rose" />
        <StatCard label="Warehouses Active" value={stats.total_warehouses} subtitle="NDRF regional depots" icon={Warehouse} color="emerald" />
        <StatCard label="People Affected" value={stats.total_population} subtitle="Across all disasters" icon={Users} color="amber" />
        <StatCard label="Allocations Made" value={stats.total_allocations} subtitle="Resource dispatches" icon={Package} color="purple" />
        <StatCard label="ML Models" value="3" subtitle="XGBoost · RF · LR" icon={Cpu} color="cyan" />
      </div>

      {/* Map & Charts Row 1 */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3><Map style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Disaster Hotspot Map</h3>
            <span className="badge badge-blue">Live</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="map-container">
              <MapContainer center={[22.5, 80]} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
                <TileLayer
                  attribution="© CartoDB © OpenStreetMap"
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                />
                {disasters && disasters.map(d => (
                  <CircleMarker
                    key={`d-${d.id}`}
                    center={[d.latitude, d.longitude]}
                    radius={Math.max(6, d.severity * 1.2)}
                    fillColor={getSeverityColor(d.severity)}
                    color={getSeverityColor(d.severity)}
                    weight={2} opacity={0.9} fillOpacity={0.5}
                  >
                    <Popup>
                      <h4>{d.disaster_type}</h4>
                      <p><strong>District:</strong> {d.district}, {d.state}</p>
                      <p><strong>Severity:</strong> {d.severity}/10</p>
                      <p><strong>Population:</strong> {Number(d.population_affected).toLocaleString()}</p>
                      <p><strong>Status:</strong> {d.status || 'Active'}</p>
                    </Popup>
                  </CircleMarker>
                ))}
                {warehouses && warehouses.map(wh => (
                  <Marker key={`wh-${wh.warehouse_id}`} position={[wh.latitude, wh.longitude]} icon={warehouseIcon}>
                    <Popup>
                      <h4>🏭 {wh.warehouse_name || wh.warehouse_id}</h4>
                      <p><strong>Location:</strong> {wh.district}, {wh.state}</p>
                      <p><strong>Food Stock:</strong> {Number(wh.food_stock).toLocaleString()}</p>
                      <p><strong>Medical Stock:</strong> {Number(wh.medical_stock).toLocaleString()}</p>
                      <p><strong>Water Stock:</strong> {Number(wh.water_stock).toLocaleString()}</p>
                      <p><strong>Clothing Stock:</strong> {Number(wh.clothing_stock).toLocaleString()}</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><BarChart2 style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Disaster Type Distribution</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {chart_data.type_distribution && (
                <Doughnut
                  data={{
                    labels: chart_data.type_distribution.labels,
                    datasets: [{
                      data: chart_data.type_distribution.values,
                      backgroundColor: ['#f48296', '#88b293', '#f4b393', '#e56b8f', '#ff9eaf', '#7bb2e8'],
                      borderWidth: 0,
                      hoverOffset: 8,
                    }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3><Package style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Predicted vs. Allocated Resources</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {chart_data.resource_totals && (
                <Bar
                  data={{
                    labels: ['Food', 'Medical', 'Water', 'Clothing'],
                    datasets: [
                      {
                        label: 'Predicted Demand',
                        data: [chart_data.resource_totals.food, chart_data.resource_totals.medical, chart_data.resource_totals.water || 0, chart_data.resource_totals.clothing || 0],
                        backgroundColor: 'rgba(244, 130, 150, 0.45)',
                        borderColor: '#f48296', borderWidth: 2, borderRadius: 6,
                      },
                      {
                        label: 'Allocated Resources',
                        data: [
                          chart_data.resource_allocated?.food || 0, chart_data.resource_allocated?.medical || 0,
                          chart_data.resource_allocated?.water || 0, chart_data.resource_allocated?.clothing || 0,
                        ],
                        backgroundColor: 'rgba(136, 178, 147, 0.45)',
                        borderColor: '#88b293', borderWidth: 2, borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, labels: { color: '#475569', padding: 10, usePointStyle: true } } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: v => formatNumber(v) } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><Target style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Severity Distribution</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {chart_data.severity_distribution && (
                <Bar
                  data={{
                    labels: chart_data.severity_distribution.labels,
                    datasets: [{
                      label: 'Disasters',
                      data: chart_data.severity_distribution.values,
                      backgroundColor: chart_data.severity_distribution.labels.map(s => {
                        if (s >= 8) return '#e56b8f99'
                        if (s >= 6) return '#f4a26199'
                        if (s >= 4) return '#e9c46a99'
                        return '#88b29399'
                      }),
                      borderRadius: 4,
                    }],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
                      x: { grid: { display: false }, title: { display: true, text: 'Severity Level' } },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Disasters Table */}
      <div className="card">
        <div className="card-header">
          <h3><FileText style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Recent Disasters</h3>
          {user && (user.role === 'admin' || user.role === 'officer' || user.role === 'ngo') && (
            <Link to="/disaster/new" className="btn btn-primary btn-sm">+ Report New</Link>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table" id="disasters-table">
              <thead>
                <tr>
                  <th>ID</th><th>Type</th><th>Severity</th><th>District</th>
                  <th>Population</th><th>Food Req.</th><th>Medical Req.</th>
                  <th>Water Req.</th><th>Clothing Req.</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent_disasters && recent_disasters.map(d => (
                  <tr key={d.id}>
                    <td className="fw-600">#{d.id}</td>
                    <td><span className={`badge ${getDisasterBadgeClass(d.disaster_type)}`}>{d.disaster_type}</span></td>
                    <td>
                      <span className={`fw-700 ${d.severity >= 8 ? 'text-rose' : d.severity >= 5 ? 'text-amber' : 'text-emerald'}`}>
                        {d.severity}/10
                      </span>
                    </td>
                    <td>{d.district}, {d.state}</td>
                    <td>{formatNumberFull(d.population_affected)}</td>
                    <td>{formatNumberFull(d.food_required)}</td>
                    <td>{formatNumberFull(d.medical_required)}</td>
                    <td>{formatNumberFull(d.water_required)}</td>
                    <td>{formatNumberFull(d.clothing_required)}</td>
                    <td><span className={`badge ${getStatusBadgeClass(d.status)}`}>{d.status}</span></td>
                    <td>
                      {d.status === 'Allocated' || d.has_allocations ? (
                        <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Already Allocated</span>
                      ) : user && (user.role === 'admin' || user.role === 'officer') ? (
                        <button className="btn btn-success btn-sm" onClick={() => handleAllocate(d.id)}>Allocate</button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        message="Are you sure you want to allocate resources for this disaster?"
        onConfirm={doAllocate}
        onCancel={() => setConfirmModal({ open: false, disasterId: null })}
      />
    </Layout>
  )
}
