import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../services/api'
import {
  Home,
  Search,
  Heart,
  FileText,
  Settings,
  Shield,
  BarChart3,
  ChevronDown,
  X,
  LogOut
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  useTheme()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [expandedItem, setExpandedItem] = useState(null)
  const [availablePetsCount, setAvailablePetsCount] = useState(null)
  const [favoritesCount, setFavoritesCount] = useState(null)
  const [myPetsCount, setMyPetsCount] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchAvailablePetsCount = async () => {
      try {
        const response = await apiClient.get('/v1/pets')
        if (!isMounted || !Array.isArray(response.data)) return

        const availableCount = response.data.filter((pet) => {
          const status = pet?.status?.value || pet?.status
          return String(status || '').toLowerCase() === 'available'
        }).length

        setAvailablePetsCount(availableCount)
      } catch {
        if (isMounted) setAvailablePetsCount(null)
      }
    }

    fetchAvailablePetsCount()

    return () => {
      isMounted = false
    }
  }, [])

  // Load favorites count for adopters
  useEffect(() => {
    if (user?.role !== 'adopter') return

    let isMounted = true

    const fetchFavoritesCount = async () => {
      try {
        const response = await apiClient.get('/v1/favorites/count')
        if (isMounted && response.data?.count !== undefined) {
          setFavoritesCount(response.data.count)
        }
      } catch {
        if (isMounted) setFavoritesCount(null)
      }
    }

    fetchFavoritesCount()

    return () => {
      isMounted = false
    }
  }, [user?.role])

  // Load owned pets count for owner users
  useEffect(() => {
    if (!user?.id || user?.role !== 'owner') {
      setMyPetsCount(null)
      return
    }

    let isMounted = true

    const fetchMyPetsCount = async () => {
      try {
        const response = await apiClient.get('/v1/pets')
        if (!isMounted || !Array.isArray(response.data)) return

        const ownedCount = response.data.filter(
          (pet) => Number(pet?.owner_id) === Number(user.id)
        ).length

        setMyPetsCount(ownedCount)
      } catch {
        if (isMounted) setMyPetsCount(null)
      }
    }

    fetchMyPetsCount()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.role])

  // Build menu items based on user role
  const getMenuItems = () => {
    const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

    const baseItems = [
      {
        label: 'Dashboard',
        icon: Home,
        path: dashboardPath,
        roles: ['admin', 'adopter', 'owner']
      },
      {
        label: 'Browse Pets',
        icon: Search,
        path: '/pets',
        roles: ['admin', 'adopter'],
        badge: availablePetsCount === null ? null : String(availablePetsCount)
      }
    ]

    const adopterItems = [
      {
        label: 'My Favorites',
        icon: Heart,
        path: '/favorites',
        roles: ['adopter'],
        badge: favoritesCount === null ? null : String(favoritesCount)
      },
      {
        label: 'My Requests',
        icon: FileText,
        path: '/requests',
        roles: ['adopter'],
        submenu: [
          { label: 'Active', path: '/requests?view=active' },
          { label: 'Completed', path: '/requests?view=completed' }
        ]
      }
    ]

    const ownerItems = [
      {
        label: 'My Pets',
        icon: Heart,
        path: '/pets?view=my',
        roles: ['owner'],
        badge: myPetsCount === null ? null : String(myPetsCount)
      },
      {
        label: 'Adoption Requests',
        icon: FileText,
        path: '/requests',
        roles: ['owner'],
        submenu: [
          { label: 'Pending', path: '/requests?status=pending' },
          { label: 'Approved', path: '/requests?status=approved' },
          { label: 'Rejected', path: '/requests?status=rejected' }
        ]
      }
    ]

    const adminItems = [
      {
        label: 'Admin Panel',
        icon: Shield,
        path: '/admin',
        roles: ['admin'],
        submenu: [
          { label: 'Users', path: '/admin/users' },
          { label: 'Pets', path: '/admin/pets' },
          { label: 'Requests', path: '/admin/requests' },
          { label: 'Donations', path: '/admin/donations' },
          { label: 'Stray Reports', path: '/admin/stray-reports' }
        ]
      },
      {
        label: 'Analytics',
        icon: BarChart3,
        path: '/admin/analytics',
        roles: ['admin']
      }
    ]

    // Filter items by user role
    const allItems = [...baseItems, ...adopterItems, ...ownerItems, ...adminItems]
    return allItems.filter(item => user && item.roles.includes(user.role))
  }

  const settingsItems = [
    {
      label: 'Settings',
      icon: Settings,
      path: '/profile',
      roles: ['admin', 'adopter', 'owner']
    }
  ]

  const menuItems = getMenuItems()

  const toggleSubmenu = (index) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  const menuItemClass = (isActive = false) => `
    theme-nav-item dashboard-lift w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
    text-gray-700 dark:text-gray-300
    cursor-pointer font-medium
    ${isActive ? 'theme-nav-active' : ''}
  `

  const isSubItemActive = (path) => {
    const [targetPathname, targetSearch = ''] = path.split('?')
    if (location.pathname !== targetPathname) return false

    if (!targetSearch) return true

    const current = new URLSearchParams(location.search)
    const target = new URLSearchParams(targetSearch)

    for (const [key, value] of target.entries()) {
      if (current.get(key) !== value) return false
    }

    return true
  }

  const isMenuItemActive = (path) => {
    const [targetPathname, targetSearch = ''] = path.split('?')
    if (location.pathname !== targetPathname) return false

    const current = new URLSearchParams(location.search)

    if (!targetSearch) {
      if (targetPathname === '/pets') {
        return current.get('view') !== 'my'
      }

      return true
    }

    const target = new URLSearchParams(targetSearch)

    for (const [key, value] of target.entries()) {
      if (current.get(key) !== value) return false
    }

    return true
  }

  const handleNavClick = () => {
    if (isOpen) onClose()
  }

  const handleLogout = () => {
    logout()
    handleNavClick()
  }

  const MenuItem = ({ item, index, submenu }) => {
    const Icon = item.icon
    const isExpanded = expandedItem === index
    const hasSubmenu = submenu && submenu.length > 0

    return (
      <div key={index}>
        {hasSubmenu ? (
          <button
            onClick={() => {
              if (hasSubmenu) {
                toggleSubmenu(index)
              }
            }}
            className={menuItemClass()}
          >
            <div className="flex items-center gap-3 flex-1">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform flex-shrink-0 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            onClick={handleNavClick}
            className={({ isActive }) => menuItemClass(isActive && isMenuItemActive(item.path))}
          >
            <div className="flex items-center gap-3 flex-1">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </div>
          </NavLink>
        )}

        {/* Submenu */}
        {hasSubmenu && isExpanded && (
          <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
            {submenu.map((subitem, subindex) => (
              <NavLink
                key={subitem.path}
                to={subitem.path}
                onClick={handleNavClick}
                className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                  isSubItemActive(subitem.path)
                    ? 'theme-nav-active font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {subitem.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-950
          border-r border-gray-200 dark:border-gray-800 overflow-y-auto
          transition-transform duration-300 z-30 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-6">
          
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* User Info */}
          {user && (
            <div className="dashboard-panel px-2 py-3 theme-surface rounded-2xl border theme-border">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Logged in as
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {user.email}
              </p>
              <p className="text-xs theme-primary-text font-semibold mt-1">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          )}

          {/* Main Menu */}
          {menuItems.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2">
                Menu
              </h2>
              {menuItems.map((item, index) => (
                <MenuItem key={index} item={item} index={index} submenu={item.submenu} />
              ))}
            </div>
          )}

          {/* Settings Menu */}
          {settingsItems.length > 0 && (
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2">
                Preferences
              </h2>
              {settingsItems.map((item, index) => (
                <MenuItem key={index} item={item} index={index + 100} submenu={item.submenu} />
              ))}
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20
                transition-all duration-200 hover:-translate-y-0.5 font-medium border border-red-200 dark:border-red-800/50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Help Card */}
          <div className="dashboard-panel bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20
            rounded-2xl p-4 border border-violet-200 dark:border-violet-800">
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-2">
              Need Help?
            </h3>
            <p className="text-xs text-violet-700 dark:text-violet-300 mb-3">
              Have questions about our platform? Check out our FAQ.
            </p>
            <button className="theme-primary-bg w-full px-3 py-2 text-sm font-medium rounded-lg">
              Learn More
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
