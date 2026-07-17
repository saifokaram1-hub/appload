import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateApp from './pages/CreateApp';
import AppRunner from './pages/AppRunner';
import PublicRun from './pages/PublicRun';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApps from './pages/admin/AdminApps';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Öffentlich geteilte App — ohne Login nutzbar */}
      <Route path="/p/:id" element={<PublicRun />} />

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
        <Route path="/app/create" element={<CreateApp />} />
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
