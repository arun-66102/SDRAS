import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  AlertTriangle, Sparkles, FileText, CloudRain, Cpu
} from 'lucide-react'

export default function DisasterFormPage() {
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { showFlash } = useFlash()
  const navigate = useNavigate()

  // Form state
  const [disasterType, setDisasterType] = useState('')
  const [severity, setSeverity] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [district, setDistrict] = useState('')
  const [populationAffected, setPopulationAffected] = useState('')
  const [rainfallMm, setRainfallMm] = useState('')
  const [temperatureC, setTemperatureC] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  useEffect(() => {
    api.get('/api/disaster/form-data')
      .then(d => { setFormData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  // Derived: unique states
  const states = useMemo(() => {
    if (!formData) return []
    const s = new Set(formData.districts.map(d => d.state))
    return [...s].sort()
  }, [formData])

  // Derived: filtered districts
  const filteredDistricts = useMemo(() => {
    if (!formData) return []
    if (!selectedState) return formData.districts
    return formData.districts.filter(d => d.state === selectedState)
  }, [formData, selectedState])

  // Rainfall logic
  const isRainfallRequired = formData && formData.rainfall_required_disasters.includes(disasterType)

  const handleStateChange = (state) => {
    setSelectedState(state)
    setDistrict('')
    setLatitude('')
    setLongitude('')
  }

  const handleDistrictChange = (districtName) => {
    setDistrict(districtName)
    const d = formData?.districts.find(x => x.district === districtName)
    if (d) {
      setLatitude(d.lat)
      setLongitude(d.lon)
      if (!selectedState) setSelectedState(d.state)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        disaster_type: disasterType,
        severity: parseInt(severity),
        population_affected: parseInt(populationAffected),
        rainfall_mm: rainfallMm ? parseFloat(rainfallMm) : 0,
        temperature_c: parseFloat(temperatureC),
        disaster_duration_days: parseInt(durationDays),
        district,
        state: selectedState,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }
      const result = await api.post('/api/disaster/new', payload)
      showFlash(result.message, 'success')
      navigate('/dashboard')
    } catch (err) {
      showFlash(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setDisasterType(''); setSeverity(''); setSelectedState(''); setDistrict('')
    setPopulationAffected(''); setRainfallMm(''); setTemperatureC('')
    setDurationDays(''); setLatitude(''); setLongitude('')
  }

  if (loading) return <Layout activePage="disaster_form" pageTitle="Report New Disaster"><LoadingSpinner /></Layout>

  return (
    <Layout
      activePage="disaster_form"
      pageTitle={<><AlertTriangle style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Report New Disaster</>}
    >
      <div className="grid-2">
        {/* Disaster Input Form */}
        <div className="card">
          <div className="card-header">
            <h3>Disaster Information Input</h3>
            <span className="badge badge-blue">Module ②</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} id="disaster-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="disaster_type">Disaster Type</label>
                  <select id="disaster_type" className="form-control" required value={disasterType} onChange={e => setDisasterType(e.target.value)}>
                    <option value="">Select type...</option>
                    {formData.disaster_types.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="severity">Severity (1-10)</label>
                  <input type="number" id="severity" className="form-control" min="1" max="10" placeholder="1 = Low, 10 = Critical" required value={severity} onChange={e => setSeverity(e.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <select id="state" className="form-control" required value={selectedState} onChange={e => handleStateChange(e.target.value)}>
                    <option value="">Select state...</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="district">District</label>
                  <select id="district" className="form-control" required value={district} onChange={e => handleDistrictChange(e.target.value)}>
                    <option value="">Select district...</option>
                    {filteredDistricts.map(d => <option key={`${d.district}-${d.state}`} value={d.district}>{d.district}, {d.state}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="population_affected">Population Affected</label>
                  <input type="number" id="population_affected" className="form-control" min="1" placeholder="Number of people affected" required value={populationAffected} onChange={e => setPopulationAffected(e.target.value)} />
                </div>

                <div className={`form-group ${isRainfallRequired ? 'rainfall-required' : disasterType ? 'rainfall-optional' : ''}`} id="rainfall-group">
                  <label htmlFor="rainfall_mm">
                    Rainfall (mm)
                    {isRainfallRequired && <span className="badge badge-amber" style={{ fontSize: '0.65rem', marginLeft: '0.35rem' }}>Required</span>}
                    {disasterType && !isRainfallRequired && <span className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '0.35rem' }}>(Optional)</span>}
                  </label>
                  <input type="number" id="rainfall_mm" className="form-control" min="0" max="1000" step="0.01"
                    placeholder={isRainfallRequired ? '0 - 1000 mm (Required)' : '0 - 1000 mm (Optional)'}
                    required={isRainfallRequired}
                    value={rainfallMm} onChange={e => setRainfallMm(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="temperature_c">Temperature (°C)</label>
                  <input type="number" id="temperature_c" className="form-control" min="0" max="50" step="0.1" placeholder="10 - 45 °C" required value={temperatureC} onChange={e => setTemperatureC(e.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="disaster_duration_days">Duration (Days)</label>
                  <input type="number" id="disaster_duration_days" className="form-control" min="1" max="365" placeholder="Expected duration" required value={durationDays} onChange={e => setDurationDays(e.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input type="number" id="latitude" className="form-control" step="0.0001" placeholder="Auto-filled" readOnly value={latitude} />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input type="number" id="longitude" className="form-control" step="0.0001" placeholder="Auto-filled" readOnly value={longitude} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                  <Sparkles style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
                  {submitting ? 'Submitting...' : 'Submit & Predict Resources'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleReset}>Clear Form</button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Guidelines */}
        <div>
          <div className="card mb-3">
            <div className="card-header">
              <h3><FileText style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Severity Scale Guide</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="alert-card success" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                  <div className="alert-title" style={{ fontSize: '0.8rem' }}>1-3: Low Severity</div>
                  <div className="alert-message" style={{ fontSize: '0.75rem' }}>Minor impact, local response sufficient. Limited displacement expected.</div>
                </div>
                <div className="alert-card info" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                  <div className="alert-title" style={{ fontSize: '0.8rem' }}>4-5: Moderate</div>
                  <div className="alert-message" style={{ fontSize: '0.75rem' }}>District-level coordination needed. Moderate resource deployment.</div>
                </div>
                <div className="alert-card warning" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                  <div className="alert-title" style={{ fontSize: '0.8rem' }}>6-7: High Severity</div>
                  <div className="alert-message" style={{ fontSize: '0.75rem' }}>State-level response activated. Significant resource needs.</div>
                </div>
                <div className="alert-card critical" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                  <div className="alert-title" style={{ fontSize: '0.8rem' }}>8-10: Critical</div>
                  <div className="alert-message" style={{ fontSize: '0.75rem' }}>National emergency. All NDRF battalions deployed. Maximum priority.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rainfall Info Card */}
          {disasterType && (
            <div className="card mb-3">
              <div className="card-header">
                <h3><CloudRain style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Rainfall Information</h3>
              </div>
              <div className="card-body">
                <div className="alert-card info" style={{ margin: 0, padding: '0.75rem 1rem' }}>
                  <div className="alert-title" style={{ fontSize: '0.8rem' }}>Weather-Related Disaster</div>
                  <div className="alert-message" style={{ fontSize: '0.75rem' }}>
                    {isRainfallRequired
                      ? <>Rainfall data is <strong>required</strong> for <strong>{disasterType}</strong> as it directly impacts resource predictions for water supply and food spoilage.</>
                      : <>Rainfall data is <strong>optional</strong> for <strong>{disasterType}</strong>. Enter 0 or leave blank if not applicable.</>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3><Cpu style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> ML Models Used</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { name: 'XGBoost Regressor', desc: 'Gradient Boosting — Primary Model', color: '#3b82f6' },
                  { name: 'Random Forest', desc: 'Ensemble Trees — Robust Performance', color: '#10b981' },
                  { name: 'Linear Regression', desc: 'Baseline Model — Interpretable', color: '#f59e0b' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }}></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
