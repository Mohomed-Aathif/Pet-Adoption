import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, Sun, Moon, LogOut, Loader } from 'lucide-react'
import apiClient from '../../services/api'

export default function Navbar({ onMenuToggle, isSidebarOpen }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [unseenCount, setUnseenCount] = useState(0)

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    navigate('/login')
  }

  // Default avatar
  const getInitials = (email) => {
    return email?.split('@')[0].substring(0, 2).toUpperCase() || 'U'
  }

  const userInitials = getInitials(user?.email)

  const getLastSeenKey = () => {
    const userId = user?.id ?? 'unknown'
    const role = user?.role ?? 'unknown'
    return `notifications_last_seen_${userId}_${role}`
  }

  const markNotificationsSeen = () => {
    if (!user) return
    localStorage.setItem(getLastSeenKey(), new Date().toISOString())
    setUnseenCount(0)
  }

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnseenCount(0)
      return
    }

    let isMounted = true

    const loadUnseenCount = async () => {
      try {
        const endpoint = user.role === 'adopter'
          ? '/v1/adoptions/me'
          : '/v1/adoptions/requests?skip=0&limit=100'

        const response = await apiClient.get(endpoint)
        if (!isMounted) return

        const items = Array.isArray(response.data) ? response.data : []
        const lastSeenKey = getLastSeenKey()
        const lastSeenValue = localStorage.getItem(lastSeenKey)

        // First load for a user/session: initialize baseline without showing old requests as new.
        if (!lastSeenValue) {
          localStorage.setItem(lastSeenKey, new Date().toISOString())
          setUnseenCount(0)
          return
        }

        const lastSeenTs = new Date(lastSeenValue).getTime()
        const unseen = items.filter((item) => {
          const createdTs = new Date(item.created_at || item.updated_at || 0).getTime()
          return Number.isFinite(createdTs) && createdTs > lastSeenTs
        }).length

        setUnseenCount(unseen)
      } catch {
        if (isMounted) setUnseenCount(0)
      }
    }

    loadUnseenCount()
    const intervalId = setInterval(loadUnseenCount, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [isAuthenticated, user?.id, user?.role])

  return (
    <nav className="sticky top-0 z-40 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Menu Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🐾</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                PetAdopt
              </h1>
            </Link>
          </div>

          {/* Center spacer */}
          <div className="hidden md:block flex-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notifications (hidden on mobile) */}
            <Link
              to="/notifications"
              onClick={markNotificationsSeen}
              className="relative hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-5 text-center">
                  {unseenCount > 99 ? '99+' : unseenCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated && !loading && user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {userInitials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold capitalize">
                        {user.role}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/notifications"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Notifications
                    </Link>
                    <hr className="border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            )}

            {/* Not Authenticated */}
            {!isAuthenticated && !loading && (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

