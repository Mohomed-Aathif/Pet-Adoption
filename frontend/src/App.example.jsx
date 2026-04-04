import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/layout/Layout'

// Import all page components
import Home from './components/pages/Home'
import PetsBrowse from './components/pages/PetsBrowse'
import Settings from './components/pages/Settings'

// Import other components as you create them
// import LoginForm from './components/forms/LoginForm'
// import RegisterForm from './components/forms/RegisterForm'
// import PetDetail from './components/pages/PetDetail'
// import UserProfile from './components/pages/UserProfile'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main layout with navbar and sidebar */}
          <Route path="/" element={<Layout />}>
            
            {/* Home/Dashboard */}
            <Route index element={<Home />} />
            
            {/* Pets */}
            <Route path="pets" element={<PetsBrowse />} />
            {/* <Route path="pets/:id" element={<PetDetail />} /> */}
            {/* <Route path="favorites" element={<FavoritesPets />} /> */}
            
            {/* User */}
            <Route path="settings" element={<Settings />} />
            {/* <Route path="profile" element={<UserProfile />} /> */}
            {/* <Route path="adoptions" element={<MyAdoptions />} /> */}
            
            {/* Admin Routes */}
            {/* <Route path="admin" element={<AdminLayout />}> */}
            {/*   <Route index element={<AdminDashboard />} /> */}
            {/*   <Route path="users" element={<UserManagement />} /> */}
            {/*   <Route path="pets" element={<PetManagement />} /> */}
            {/* </Route> */}
            
          </Route>

          {/* Auth Routes (outside layout) */}
          {/* <Route path="/login" element={<LoginForm />} /> */}
          {/* <Route path="/register" element={<RegisterForm />} /> */}

          {/* 404 Not Found */}
          {/* <Route path="*" element={<NotFound />} /> */}
          
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

/*
═════════════════════════════════════════════════════════════
                     ROUTE STRUCTURE NOTES
═════════════════════════════════════════════════════════════

ACTIVE ROUTES:
✓ / (Home)
✓ /pets (Browse Pets)
✓ /settings (Settings)

TO ADD ROUTES:
1. Create component in src/components/pages/
2. Import at top of this file
3. Add <Route> in the Routes section under <Layout>
4. Add menu item in src/components/layout/Sidebar.jsx

EXAMPLE - Add Pet Detail Page:
────────────────────────────

// Step 1: Create component
// File: src/components/pages/PetDetail.jsx
import { useParams } from 'react-router-dom'
export default function PetDetail() {
  const { id } = useParams()
  return <div>Pet #{id} details</div>
}

// Step 2: Import here
import PetDetail from './components/pages/PetDetail'

// Step 3: Add route
<Route path="pets/:id" element={<PetDetail />} />

// Step 4: Add sidebar menu item in Sidebar.jsx
{ label: 'Pet Detail', icon: Heart, path: '/pets/1' }

════════════════════════════════════════════════════════════

RECOMMENDED PAGE STRUCTURE:
────────────────────────────

Home/Dashboard
├─ Hero section
├─ Featured pets
├─ Quick stats
└─ Call-to-action

Browse/List Pages
├─ Filters sidebar
├─ Search bar
├─ Item grid/list
└─ Pagination

Detail Pages
├─ Full information
├─ Related items
└─ Action buttons

Settings/Admin
├─ Form sections
├─ Organized tabs
└─ Action buttons

════════════════════════════════════════════════════════════

PROTECTED ROUTES (Add Later):
──────────────────────────

import ProtectedRoute from './components/auth/ProtectedRoute'

<Route path="/profile" element={
  <ProtectedRoute requiredRole="user">
    <UserProfile />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />

════════════════════════════════════════════════════════════

LAYOUT BEHAVIOR:
────────────────

• All routes under <Route path="/" element={<Layout />}> 
  will have Navbar + Sidebar
  
• Auth pages should be in separate routes outside Layout
  to avoid showing nav/sidebar on login/register pages
  
• The <Outlet /> in Layout.jsx is where page content renders

════════════════════════════════════════════════════════════
*/
