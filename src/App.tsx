import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppRunner from './pages/AppRunner';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApps from './pages/admin/AdminApps';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Voll-Bild App-Runner (ohne Layout) */}
      <Route
        path="/app/run/:id"
        element={
          <ProtectedRoute>
            <AppRunner />
          </ProtectedRoute>
        }
      />

      {/* Angemeldeter Bereich mit Navigation */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/app" element={<Dashboard />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allow={['admin', 'support']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/apps"
          element={
            <ProtectedRoute allow={['admin', 'support']}>
              <AdminApps />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
