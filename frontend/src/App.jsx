import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, RoleProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Home from './components/pages/Home'
import PetsBrowse from './components/pages/PetsBrowse'
import Profile from './components/pages/Profile'
import Notifications from './components/pages/Notifications'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import AdminDashboard from './components/pages/AdminDashboard'
import AdminUsers from './components/pages/AdminUsers'
import AdminPets from './components/pages/AdminPets'
import AdminRequests from './components/pages/AdminRequests'
import AdminAnalytics from './components/pages/AdminAnalytics'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="pets" element={<PetsBrowse />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route
              path="admin"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/pets"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminPets />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/requests"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminRequests />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
