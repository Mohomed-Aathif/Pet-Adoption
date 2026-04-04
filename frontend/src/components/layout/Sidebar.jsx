import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../contexts/AuthContext'
import {
  Home,
  Search,
  Heart,
  FileText,
  Settings,
  Users,
  Shield,
  BarChart3,
  ChevronDown,
  X,
  LogOut
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  useTheme()
  const { user, logout } = useAuth()
  const [expandedItem, setExpandedItem] = useState(null)

  // Build menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        label: 'Dashboard',
        icon: Home,
        path: '/',
        roles: ['admin', 'adopter', 'owner', 'shelter']
      },
      {
        label: 'Browse Pets',
        icon: Search,
        path: '/pets',
        roles: ['admin', 'adopter', 'owner'],
        badge: '12'
      }
    ]

    const adopterItems = [
      {
        label: 'My Favorites',
        icon: Heart,
        path: '/profile',
        roles: ['adopter'],
        badge: '5'
      },
      {
        label: 'My Requests',
        icon: FileText,
        path: '/notifications',
        roles: ['adopter'],
        submenu: [
          { label: 'Active', path: '/notifications' },
          { label: 'Completed', path: '/notifications' }
        ]
      }
    ]

    const shelterItems = [
      {
        label: 'My Pets',
        icon: Heart,
        path: '/pets',
        roles: ['shelter'],
        badge: '8'
      },
      {
        label: 'Adoption Requests',
        icon: FileText,
        path: '/notifications',
        roles: ['shelter'],
        submenu: [
          { label: 'Pending', path: '/notifications' },
          { label: 'Approved', path: '/notifications' },
          { label: 'Rejected', path: '/notifications' }
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
          { label: 'Requests', path: '/admin/requests' }
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
    const allItems = [...baseItems, ...adopterItems, ...shelterItems, ...adminItems]
    return allItems.filter(item => user && item.roles.includes(user.role))
  }

  const settingsItems = [
    {
      label: 'Settings',
      icon: Settings,
      path: '/profile',
      roles: ['admin', 'adopter', 'owner', 'shelter']
    }
  ]

  const menuItems = getMenuItems()

  const toggleSubmenu = (index) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  const menuItemClass = (isActive = false) => `
    w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
    text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
    transition-colors cursor-pointer font-medium
    ${isActive ? 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : ''}
  `

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
            className={({ isActive }) => menuItemClass(isActive)}
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
                key={subindex}
                to={subitem.path}
                onClick={handleNavClick}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400
                   hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800
                   rounded-lg transition-colors"
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
          transition-transform duration-300 z-30
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
            <div className="px-2 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Logged in as
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {user.email}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
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
                transition-colors font-medium border border-red-200 dark:border-red-800/50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Help Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20
            rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Need Help?
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Have questions about our platform? Check out our FAQ.
            </p>
            <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white
              text-sm font-medium rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
