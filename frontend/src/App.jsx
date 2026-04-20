import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, RoleProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Home from './components/pages/Home'
import PetsBrowse from './components/pages/PetsBrowse'
import Profile from './components/pages/Profile'
import Favorites from './components/pages/Favorites'
import Notifications from './components/pages/Notifications'
import AdoptionRequests from './components/pages/AdoptionRequests'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import AdminUsers from './components/pages/AdminUsers'
import AdminPets from './components/pages/AdminPets'
import AdminRequests from './components/pages/AdminRequests'
import AdminAnalytics from './components/pages/AdminAnalytics'
import Donation from './components/pages/Donation'
import DonationPayment from './components/pages/DonationPayment'
import AdminDonations from './components/pages/AdminDonations'
import DashboardHome from './components/pages/DashboardHome'
import ReportStray from './components/pages/ReportStray'
import AdminStrayReports from './components/pages/AdminStrayReports'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/donate" element={<Donation />} />
          <Route path="/donate/payment" element={<DonationPayment />} />
          <Route path="/report-stray" element={<ReportStray />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="pets" element={<PetsBrowse />} />
            <Route path="profile" element={<Profile />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="notifications" element={<Notifications />} />
            <Route
              path="requests"
              element={
                <RoleProtectedRoute allowedRoles={['adopter', 'owner']}>
                  <AdoptionRequests />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <DashboardHome />
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
            <Route
              path="admin/donations"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminDonations />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/stray-reports"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminStrayReports />
                </RoleProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
