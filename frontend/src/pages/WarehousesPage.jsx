import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumberFull } from '../utils/formatNumber'
import {
  Warehouse as WarehouseIcon, Package, Heart, Droplet, Shirt,
  Map, Plus, Edit3, Shield
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const warehouseIcon = L.divIcon({
  className: 'custom-warehouse-icon',
  html: '<div style="background:#3b82f6;width:12px;height:12px;border-radius:3px;border:2px solid #fff;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export default function WarehousesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { showFlash } = useFlash()

  // Modal states
  const [editModal, setEditModal] = useState({ open: false, whId: null, code: '', food: 0, medical: 0, water: 0, clothing: 0 })
  const [thresholdModal, setThresholdModal] = useState({ open: false, whId: null, code: '', food: 0, medical: 0, water: 0, clothing: 0 })
  const [addModal, setAddModal] = useState(false)
  const [newWh, setNewWh] = useState({ warehouse_id: '', warehouse_name: '', district: '', state: '', latitude: '', longitude: '', food_stock: 0, medical_stock: 0, water_stock: 0, clothing_stock: 0 })

  const loadData = () => {
    api.get('/api/warehouses')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  // Edit Stock
  const openEditStock = (wh) => {
    setEditModal({ open: true, whId: wh.id, code: wh.warehouse_id, food: wh.food_stock, medical: wh.medical_stock, water: wh.water_stock, clothing: wh.clothing_stock })
  }

  const submitStockUpdate = async () => {
    try {
      const result = await api.put(`/api/warehouse/${editModal.whId}/stock`, {
        food_stock: parseInt(editModal.food) || 0,
        medical_stock: parseInt(editModal.medical) || 0,
        water_stock: parseInt(editModal.water) || 0,
        clothing_stock: parseInt(editModal.clothing) || 0,
      })
      showFlash(result.message, 'success')
      setEditModal({ ...editModal, open: false })
      loadData()
    } catch (err) { showFlash(err.message, 'error') }
  }

  // Threshold
  const openThreshold = (wh) => {
    setThresholdModal({ open: true, whId: wh.id, code: wh.warehouse_id, food: wh.min_food_threshold, medical: wh.min_medical_threshold, water: wh.min_water_threshold, clothing: wh.min_clothing_threshold })
  }

  const submitThresholdUpdate = async () => {
    const vals = { min_food_threshold: parseInt(thresholdModal.food) || 1, min_medical_threshold: parseInt(thresholdModal.medical) || 1, min_water_threshold: parseInt(thresholdModal.water) || 1, min_clothing_threshold: parseInt(thresholdModal.clothing) || 1 }
    for (const [, val] of Object.entries(vals)) {
      if (val <= 0) { showFlash('Threshold values must be positive (greater than 0)', 'error'); return }
    }
    try {
      const result = await api.put(`/api/warehouse/${thresholdModal.whId}/threshold`, vals)
      showFlash(result.message, 'success')
      setThresholdModal({ ...thresholdModal, open: false })
      loadData()
    } catch (err) { showFlash(err.message, 'error') }
  }

  // Add Warehouse
  const openAddWarehouse = () => {
    setNewWh({ warehouse_id: '', warehouse_name: '', district: '', state: '', latitude: '', longitude: '', food_stock: 0, medical_stock: 0, water_stock: 0, clothing_stock: 0 })
    setAddModal(true)
  }

  const handleNewWhDistrictChange = (districtName) => {
    const d = data?.districts?.find(x => x.district === districtName)
    if (d) {
      setNewWh(prev => ({ ...prev, district: districtName, state: d.state, latitude: d.lat, longitude: d.lon }))
    } else {
      setNewWh(prev => ({ ...prev, district: districtName }))
    }
  }

  const submitNewWarehouse = async () => {
    if (!newWh.warehouse_name || !newWh.district || !newWh.state) {
      showFlash('Please fill in warehouse name and select a district.', 'error'); return
    }
    try {
      const result = await api.post('/api/warehouse/new', {
        ...newWh,
        latitude: parseFloat(newWh.latitude) || 0,
        longitude: parseFloat(newWh.longitude) || 0,
        food_stock: parseInt(newWh.food_stock) || 0,
        medical_stock: parseInt(newWh.medical_stock) || 0,
        water_stock: parseInt(newWh.water_stock) || 0,
        clothing_stock: parseInt(newWh.clothing_stock) || 0,
      })
      showFlash(result.message, 'success')
      setAddModal(false)
      loadData()
    } catch (err) { showFlash(err.message, 'error') }
  }

  if (loading) return <Layout activePage="warehouses" pageTitle="Warehouse Inventory"><LoadingSpinner /></Layout>

  const { warehouses, total_food, total_medical, total_water, total_clothing, districts } = data

  return (
    <Layout
      activePage="warehouses"
      pageTitle={<><WarehouseIcon style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Warehouse Inventory</>}
    >
      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Warehouses" value={warehouses.length} subtitle="NDRF Regional Depots" icon={WarehouseIcon} color="blue" />
        <StatCard label="Total Food Stock" value={total_food} icon={Package} color="emerald" />
        <StatCard label="Total Medical Stock" value={total_medical} icon={Heart} color="rose" />
        <StatCard label="Total Water Stock" value={total_water} icon={Droplet} color="cyan" />
        <StatCard label="Total Clothing Stock" value={total_clothing} icon={Shirt} color="amber" />
      </div>

      {/* Add Warehouse Button */}
      {user?.role === 'admin' && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={openAddWarehouse}>
            <Plus style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Add New Warehouse
          </button>
        </div>
      )}

      {/* Map */}
      <div className="card mb-3">
        <div className="card-header">
          <h3><Map style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Warehouse Locations</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="map-container">
            <MapContainer center={[22.5, 80]} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
              <TileLayer
                attribution="© CartoDB © OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />
              {warehouses.map(wh => (
                <Marker key={wh.warehouse_id} position={[wh.latitude, wh.longitude]} icon={warehouseIcon}>
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

      {/* Warehouse Cards Grid */}
      <div className="grid-3">
        {warehouses.map(wh => (
          <div key={wh.id} className="warehouse-card" id={`wh-card-${wh.id}`}>
            <div className="wh-header">
              <div className="wh-icon"><WarehouseIcon style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} /></div>
              <div>
                <div className="wh-name">{wh.warehouse_id}</div>
                <div className="wh-location">{wh.district}, {wh.state}</div>
              </div>
            </div>
            <div className="stock-bars">
              {[
                { cls: 'food', label: 'Food Stock', val: wh.food_stock, max: 5000, threshold: wh.min_food_threshold },
                { cls: 'medical', label: 'Medical Stock', val: wh.medical_stock, max: 1000, threshold: wh.min_medical_threshold },
                { cls: 'water', label: 'Water Stock', val: wh.water_stock, max: 3000, threshold: wh.min_water_threshold },
                { cls: 'clothing', label: 'Clothing Stock', val: wh.clothing_stock, max: 800, threshold: wh.min_clothing_threshold },
              ].map(s => (
                <div key={s.cls} className={`stock-bar ${s.cls}`}>
                  <div className="stock-label">
                    <span>{s.label}</span>
                    <span>{formatNumberFull(s.val)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min((s.val / s.max) * 100, 100)}%` }}></div>
                    <div className="threshold-marker" style={{ left: `${Math.min((s.threshold / s.max) * 100, 100)}%` }} title={`Min Threshold: ${formatNumberFull(s.threshold)}`}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="threshold-info">
              <span className="threshold-label">Min Reserve:</span>
              F:{formatNumberFull(wh.min_food_threshold)} · M:{formatNumberFull(wh.min_medical_threshold)} · W:{formatNumberFull(wh.min_water_threshold)} · C:{formatNumberFull(wh.min_clothing_threshold)}
            </div>
            {user && (user.role === 'admin' || user.role === 'officer') && (
              <div className="wh-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEditStock(wh)}>
                  <Edit3 style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> Edit Stock
                </button>
                {user.role === 'admin' && (
                  <button className="btn btn-outline btn-sm" onClick={() => openThreshold(wh)}>
                    <Shield style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> Set Threshold
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Stock Modal */}
      {editModal.open && (
        <div className="modal-backdrop open" onClick={() => setEditModal({ ...editModal, open: false })}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Stock — {editModal.code}</h3>
              <button className="modal-close" onClick={() => setEditModal({ ...editModal, open: false })}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Food Stock</label><input type="number" className="form-control" min="0" value={editModal.food} onChange={e => setEditModal(p => ({ ...p, food: e.target.value }))} /></div>
                <div className="form-group"><label>Medical Stock</label><input type="number" className="form-control" min="0" value={editModal.medical} onChange={e => setEditModal(p => ({ ...p, medical: e.target.value }))} /></div>
                <div className="form-group"><label>Water Stock</label><input type="number" className="form-control" min="0" value={editModal.water} onChange={e => setEditModal(p => ({ ...p, water: e.target.value }))} /></div>
                <div className="form-group"><label>Clothing Stock</label><input type="number" className="form-control" min="0" value={editModal.clothing} onChange={e => setEditModal(p => ({ ...p, clothing: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditModal({ ...editModal, open: false })}>Cancel</button>
              <button className="btn btn-primary" onClick={submitStockUpdate}>Update Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {thresholdModal.open && (
        <div className="modal-backdrop open" onClick={() => setThresholdModal({ ...thresholdModal, open: false })}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Thresholds — {thresholdModal.code}</h3>
              <button className="modal-close" onClick={() => setThresholdModal({ ...thresholdModal, open: false })}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                Minimum stock reserved for local emergency supply. This stock will not be allocated to external disasters. Values must be positive (greater than 0).
              </p>
              <div className="form-grid">
                <div className="form-group"><label>Food Threshold</label><input type="number" className="form-control" min="1" value={thresholdModal.food} onChange={e => setThresholdModal(p => ({ ...p, food: e.target.value }))} /></div>
                <div className="form-group"><label>Medical Threshold</label><input type="number" className="form-control" min="1" value={thresholdModal.medical} onChange={e => setThresholdModal(p => ({ ...p, medical: e.target.value }))} /></div>
                <div className="form-group"><label>Water Threshold</label><input type="number" className="form-control" min="1" value={thresholdModal.water} onChange={e => setThresholdModal(p => ({ ...p, water: e.target.value }))} /></div>
                <div className="form-group"><label>Clothing Threshold</label><input type="number" className="form-control" min="1" value={thresholdModal.clothing} onChange={e => setThresholdModal(p => ({ ...p, clothing: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setThresholdModal({ ...thresholdModal, open: false })}>Cancel</button>
              <button className="btn btn-success" onClick={submitThresholdUpdate}>Save Thresholds</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {addModal && (
        <div className="modal-backdrop open" onClick={() => setAddModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Warehouse</h3>
              <button className="modal-close" onClick={() => setAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Warehouse ID <span className="text-muted" style={{ fontSize: '0.7rem' }}>(auto-generated if empty)</span></label><input type="text" className="form-control" placeholder="e.g. WH031" value={newWh.warehouse_id} onChange={e => setNewWh(p => ({ ...p, warehouse_id: e.target.value }))} /></div>
                <div className="form-group"><label>Warehouse Name</label><input type="text" className="form-control" placeholder="NDRF Regional Depot — City" required value={newWh.warehouse_name} onChange={e => setNewWh(p => ({ ...p, warehouse_name: e.target.value }))} /></div>
                <div className="form-group"><label>District</label>
                  <select className="form-control" value={newWh.district} onChange={e => handleNewWhDistrictChange(e.target.value)}>
                    <option value="">Select district...</option>
                    {districts && districts.map(d => <option key={`${d.district}-${d.state}`} value={d.district}>{d.district}, {d.state}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>State</label><input type="text" className="form-control" placeholder="Auto-filled" readOnly value={newWh.state} /></div>
                <div className="form-group"><label>Latitude</label><input type="number" className="form-control" step="0.0001" placeholder="Auto-filled" readOnly value={newWh.latitude} /></div>
                <div className="form-group"><label>Longitude</label><input type="number" className="form-control" step="0.0001" placeholder="Auto-filled" readOnly value={newWh.longitude} /></div>
                <div className="form-group"><label>Initial Food Stock</label><input type="number" className="form-control" min="0" value={newWh.food_stock} onChange={e => setNewWh(p => ({ ...p, food_stock: e.target.value }))} /></div>
                <div className="form-group"><label>Initial Medical Stock</label><input type="number" className="form-control" min="0" value={newWh.medical_stock} onChange={e => setNewWh(p => ({ ...p, medical_stock: e.target.value }))} /></div>
                <div className="form-group"><label>Initial Water Stock</label><input type="number" className="form-control" min="0" value={newWh.water_stock} onChange={e => setNewWh(p => ({ ...p, water_stock: e.target.value }))} /></div>
                <div className="form-group"><label>Initial Clothing Stock</label><input type="number" className="form-control" min="0" value={newWh.clothing_stock} onChange={e => setNewWh(p => ({ ...p, clothing_stock: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitNewWarehouse}>Create Warehouse</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
