import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DisasterFormPage from './pages/DisasterFormPage'
import PredictionsPage from './pages/PredictionsPage'
import AllocationsPage from './pages/AllocationsPage'
import WarehousesPage from './pages/WarehousesPage'
import ReportsPage from './pages/ReportsPage'
import UserManagementPage from './pages/UserManagementPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated, hasRole } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  const { user, isAuthenticated, loading } = useAuth()
  const homePath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/disaster/new"
        element={
          <ProtectedRoute roles={['admin', 'officer', 'ngo']}>
            <DisasterFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <PredictionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/allocations"
        element={
          <ProtectedRoute>
            <AllocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute>
            <WarehousesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />}
      />
    </Routes>
  )
}
