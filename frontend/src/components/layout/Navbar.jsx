/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, Sun, Moon, LogOut, Loader } from 'lucide-react'
import apiClient from '../../services/api'

export default function Navbar({ onMenuToggle, isSidebarOpen }) {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/65 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Menu Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="rounded-lg p-2 transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6 text-slate-100" />
              ) : (
                <Menu className="h-6 w-6 text-slate-100" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_10px_26px_rgba(167,139,250,0.5)]">
                <span className="text-white font-bold text-sm">🐾</span>
              </div>
              <h1 className="hidden text-xl font-bold text-white sm:block">
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
              className={`relative hidden rounded-lg p-2 transition-colors sm:block ${
                location.pathname === '/notifications' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-slate-100'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-300" />
              ) : (
                <Moon className="h-5 w-5 text-slate-100" />
              )}
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated && !loading && user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-300/50 bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-bold text-white">
                    {userInitials}
                  </div>
                  <span className="hidden text-sm font-medium text-white sm:block">
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/15 bg-slate-900/95 py-1 shadow-[0_18px_42px_rgba(0,0,0,0.45)] backdrop-blur-md">
                    <div className="border-b border-white/10 px-4 py-2">
                      <p className="text-sm font-medium text-white">{user.email}</p>
                      <p className="text-xs theme-primary-text font-semibold capitalize">
                        {user.role}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/notifications"
                      className="block w-full px-4 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Notifications
                    </Link>
                    <hr className="my-1 border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <Loader className="h-5 w-5 animate-spin text-violet-300" />
            )}

            {/* Not Authenticated */}
            {!isAuthenticated && !loading && (
              <Link
                to="/login"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  location.pathname === '/login'
                    ? 'bg-white text-slate-950'
                    : 'theme-primary-bg'
                }`}
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

