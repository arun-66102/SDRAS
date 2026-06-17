import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useFlash } from '../context/FlashContext'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatNumberFull } from '../utils/formatNumber'
import {
  FileText, AlertTriangle, Lightbulb, Calendar, Clock,
  Package, Heart, Droplet, Shirt
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

function DynamicIcon({ name, ...props }) {
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  const IconComponent = LucideIcons[pascalName]
  return IconComponent ? <IconComponent {...props} /> : null
}

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showFlash } = useFlash()

  useEffect(() => {
    api.get('/api/reports')
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { showFlash(err.message, 'error'); setLoading(false) })
  }, [])

  if (loading) return <Layout activePage="reports" pageTitle="Decision Support System"><LoadingSpinner /></Layout>

  const { alerts, recommendations, relief_plan, active_disaster } = data
  const hasData = (alerts && alerts.length > 0) || (recommendations && recommendations.length > 0) || (relief_plan && relief_plan.length > 0)

  return (
    <Layout
      activePage="reports"
      pageTitle={<><FileText style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Decision Support System</>}
    >
      {/* Emergency Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3><AlertTriangle style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Active Emergency Alerts</h3>
            <span className="badge badge-rose pulse">{alerts.length} Active</span>
          </div>
          <div className="card-body">
            {alerts.map((alert, i) => (
              <div key={i} className={`alert-card ${alert.level === 'CRITICAL' ? 'critical' : alert.level === 'WARNING' ? 'warning' : 'info'}`}>
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
                {alert.actions && alert.actions.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Required Actions:</div>
                    {alert.actions.map((action, j) => (
                      <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.15rem 0', paddingLeft: '1rem', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--accent-blue)' }}>›</span> {action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3><Lightbulb style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Resource Recommendations</h3>
          </div>
          <div className="card-body">
            {recommendations.map((rec, i) => (
              <div key={i} className="recommendation-card">
                <div className="rec-icon"><DynamicIcon name={rec.icon} style={{ width: 20, height: 20 }} /></div>
                <div className="rec-content">
                  <h4>{rec.message}</h4>
                  <p>{rec.action}</p>
                  <div className={`rec-priority ${rec.priority}`}>{rec.priority.toUpperCase()} PRIORITY</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relief Plan */}
      {relief_plan && relief_plan.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3><Calendar style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Phased Relief Plan</h3>
            {active_disaster && (
              <span className="badge badge-blue">{active_disaster.disaster_type} — {active_disaster.district}</span>
            )}
          </div>
          <div className="card-body">
            <div className="timeline">
              {relief_plan.map((phase, i) => (
                <div key={i} className={`timeline-item ${i === 1 ? 'phase-2' : i === 2 ? 'phase-3' : ''}`}>
                  <div className="timeline-content">
                    <h4>{phase.phase}</h4>
                    <div className="duration">
                      <Clock style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: '0.15rem', display: 'inline-block' }} /> {phase.duration}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Objectives:</div>
                    <ul>
                      {phase.objectives.map((obj, j) => <li key={j}>{obj}</li>)}
                    </ul>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem', background: 'rgba(59,130,246,0.1)', borderRadius: 4, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Package style={{ width: 12, height: 12 }} /> Food: {formatNumberFull(phase.resources.food)}
                      </div>
                      <div style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem', background: 'rgba(244,63,94,0.1)', borderRadius: 4, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Heart style={{ width: 12, height: 12 }} /> Medical: {formatNumberFull(phase.resources.medical)}
                      </div>
                      <div style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem', background: 'rgba(6,182,212,0.1)', borderRadius: 4, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Droplet style={{ width: 12, height: 12 }} /> Water: {formatNumberFull(phase.resources.water)}
                      </div>
                      <div style={{ fontSize: '0.7rem', padding: '0.35rem 0.65rem', background: 'rgba(245,158,11,0.1)', borderRadius: 4, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Shirt style={{ width: 12, height: 12 }} /> Clothing: {formatNumberFull(phase.resources.clothing)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasData && (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon"><FileText style={{ width: 48, height: 48, color: 'var(--text-muted)' }} /></div>
              <h3>No Active Incidents</h3>
              <p>Decision support data will appear when disasters are reported and resources are allocated. Report a new disaster to generate alerts, recommendations, and relief plans.</p>
              <Link to="/disaster/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <AlertTriangle style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline-block' }} /> Report Disaster
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
