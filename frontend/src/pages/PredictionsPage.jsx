import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumber } from '../utils/formatNumber'
import { Cpu, BarChart2, Sparkles, ShoppingBag, Heart, Droplet, Shirt } from 'lucide-react'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const TARGETS = [
  { key: 'food_required', label: 'Food Required', tabId: 'tab-food', icon: ShoppingBag },
  { key: 'medical_required', label: 'Medical Required', tabId: 'tab-medical', icon: Heart },
  { key: 'water_required', label: 'Water Required', tabId: 'tab-water', icon: Droplet },
  { key: 'clothing_required', label: 'Clothing Required', tabId: 'tab-clothing', icon: Shirt },
]

const MODELS = [
  { key: 'xgboost', label: 'XGBoost' },
  { key: 'random_forest', label: 'Random Forest' },
  { key: 'linear_regression', label: 'Linear Regression' },
]

const MODEL_COLORS = { xgboost: '#f48296', random_forest: '#88b293', linear_regression: '#f4b393' }

export default function PredictionsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tab-food')
  const [predicting, setPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)
  const { showFlash } = useFlash()

  // Prediction form state
  const [predForm, setPredForm] = useState({
    disaster_type: '', severity: '', population_affected: '',
    rainfall_mm: '0', temperature_c: '', disaster_duration_days: '',
  })

  useEffect(() => {
    api.get('/api/predictions')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  const handlePredFormChange = (field, value) => {
    setPredForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePredict = async (e) => {
    e.preventDefault()
    setPredicting(true)
    try {
      const result = await api.post('/api/predict', predForm)
      if (result.error) {
        showFlash(result.error, 'error')
      } else {
        setPredictionResult(result)
      }
    } catch (err) {
      showFlash(err.message, 'error')
    } finally {
      setPredicting(false)
    }
  }

  function getMetricClass(metric, value) {
    if (metric === 'mae') return value < 5000 ? 'good' : value < 15000 ? 'ok' : 'bad'
    if (metric === 'rmse') return value < 8000 ? 'good' : value < 20000 ? 'ok' : 'bad'
    if (metric === 'r2') return value > 0.9 ? 'good' : value > 0.7 ? 'ok' : 'bad'
    return ''
  }

  if (loading) return <Layout activePage="predictions" pageTitle="ML Predictions"><LoadingSpinner /></Layout>

  const { metrics, disaster_types } = data

  return (
    <Layout
      activePage="predictions"
      pageTitle={<><Cpu style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> ML Predictions</>}
    >
      {/* Model Metrics */}
      {metrics && (
        <div className="card mb-3">
          <div className="card-header">
            <h3><BarChart2 style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Model Performance Metrics</h3>
            <span className="badge badge-emerald">Trained</span>
          </div>
          <div className="card-body">
            <div className="tabs">
              {TARGETS.map(t => (
                <button
                  key={t.tabId}
                  className={`tab-btn ${activeTab === t.tabId ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.tabId)}
                >
                  <t.icon style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
                  {t.label.replace('Required', 'Prediction')}
                </button>
              ))}
            </div>

            {TARGETS.map(t => (
              <div key={t.tabId} className={`tab-content ${activeTab === t.tabId ? 'active' : ''}`} id={t.tabId}>
                <div className="prediction-grid">
                  {MODELS.map(model => {
                    const m = metrics[model.key]?.[t.key] || {}
                    return (
                      <div key={model.key} className="prediction-card">
                        <div className="model-name">{model.label}</div>
                        <div className="metrics-grid" style={{ marginTop: '1rem' }}>
                          <div className="metric-box">
                            <div className="metric-label">MAE</div>
                            <div className={`metric-value ${getMetricClass('mae', m.mae || 99999)}`}>
                              {(m.mae || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div className="metric-box">
                            <div className="metric-label">RMSE</div>
                            <div className={`metric-value ${getMetricClass('rmse', m.rmse || 99999)}`}>
                              {(m.rmse || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div className="metric-box">
                            <div className="metric-label">R²</div>
                            <div className={`metric-value ${getMetricClass('r2', m.r2 || 0)}`}>
                              {(m.r2 || 0).toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction Form */}
      <div className="card mb-3">
        <div className="card-header">
          <h3><Sparkles style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Run Prediction</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handlePredict} id="predict-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="pred-type">Disaster Type</label>
                <select id="pred-type" className="form-control" required value={predForm.disaster_type} onChange={e => handlePredFormChange('disaster_type', e.target.value)}>
                  <option value="">Select...</option>
                  {disaster_types.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="pred-severity">Severity (1-10)</label>
                <input type="number" id="pred-severity" className="form-control" min="1" max="10" required value={predForm.severity} onChange={e => handlePredFormChange('severity', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="pred-population">Population Affected</label>
                <input type="number" id="pred-population" className="form-control" min="1" required value={predForm.population_affected} onChange={e => handlePredFormChange('population_affected', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="pred-rainfall">Rainfall (mm)</label>
                <input type="number" id="pred-rainfall" className="form-control" min="0" max="1000" step="0.01" value={predForm.rainfall_mm} onChange={e => handlePredFormChange('rainfall_mm', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="pred-temp">Temperature (°C)</label>
                <input type="number" id="pred-temp" className="form-control" min="0" max="50" step="0.1" required value={predForm.temperature_c} onChange={e => handlePredFormChange('temperature_c', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="pred-duration">Duration (Days)</label>
                <input type="number" id="pred-duration" className="form-control" min="1" max="365" required value={predForm.disaster_duration_days} onChange={e => handlePredFormChange('disaster_duration_days', e.target.value)} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg" disabled={predicting}>
                <Cpu style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} />
                {predicting ? 'Running...' : 'Run All 3 Models'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Prediction Results */}
      {predicting && (
        <div className="text-center">
          <div className="spinner"></div>
          <p className="text-muted mt-2">Running ML predictions...</p>
        </div>
      )}

      {predictionResult && !predicting && (
        <>
          <h3 className="mb-3" style={{ fontSize: '1.1rem' }}>📊 Prediction Results</h3>
          <div className="prediction-grid">
            {Object.entries(predictionResult.predictions).map(([modelName, preds]) => {
              const isBest = modelName === predictionResult.best_model
              const mets = predictionResult.metrics?.[modelName] || {}
              const avgR2 = mets.food_required
                ? ((mets.food_required.r2 + mets.medical_required.r2 + (mets.water_required?.r2 || 0) + (mets.clothing_required?.r2 || 0)) / 4).toFixed(4)
                : 'N/A'
              const modelLabel = modelName === 'xgboost' ? 'XGBoost' : modelName === 'random_forest' ? 'Random Forest' : 'Linear Regression'

              return (
                <div key={modelName} className={`prediction-card ${isBest ? 'best' : ''}`}>
                  {isBest && <div className="badge badge-emerald mb-1" style={{ marginBottom: '0.75rem' }}>✓ Best Model</div>}
                  <div className="model-name">{modelLabel}</div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>FOOD REQUIRED</div>
                    <div className="prediction-value" style={{ color: MODEL_COLORS[modelName] }}>{formatNumber(preds.food_required)}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>MEDICAL KITS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-rose)' }}>{formatNumber(preds.medical_required)}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>WATER SUPPLY</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{formatNumber(preds.water_required)}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>CLOTHING SETS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{formatNumber(preds.clothing_required)}</div>
                  </div>
                  <div className="metric" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <span className="text-muted">Avg R²: </span>
                    <span className="fw-700" style={{ color: parseFloat(avgR2) > 0.9 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{avgR2}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison Chart */}
          <div className="card">
            <div className="card-header"><h3>📈 Model Comparison</h3></div>
            <div className="card-body">
              <div className="chart-container" style={{ minHeight: 280 }}>
                <Bar
                  data={{
                    labels: ['Food Required', 'Medical Kits', 'Water Supply', 'Clothing Sets'],
                    datasets: Object.entries(predictionResult.predictions).map(([modelName, preds]) => ({
                      label: modelName === 'xgboost' ? 'XGBoost' : modelName === 'random_forest' ? 'Random Forest' : 'Linear Regression',
                      data: [preds.food_required, preds.medical_required, preds.water_required, preds.clothing_required],
                      backgroundColor: MODEL_COLORS[modelName] + '99',
                      borderColor: MODEL_COLORS[modelName],
                      borderWidth: 2, borderRadius: 6,
                    })),
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(61, 46, 46, 0.06)' }, ticks: { callback: v => formatNumber(v) } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
