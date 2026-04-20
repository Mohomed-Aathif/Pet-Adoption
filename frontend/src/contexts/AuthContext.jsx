import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import apiClient from '../services/api'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const role = user?.role || 'guest'
    document.documentElement.dataset.role = role

    return () => {
      if (document.documentElement.dataset.role === role) {
        document.documentElement.dataset.role = 'guest'
      }
    }
  }, [user?.role])

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Try to fetch user info
      fetchUserInfo(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch current user info
  const fetchUserInfo = useCallback(async (accessToken) => {
    try {
      const response = await apiClient.get('/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      setUser(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch user info:', err)
      // Clear invalid token
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Register new user
  const register = useCallback(async (formData) => {
    try {
      setError(null)
      setLoading(true)

      const response = await apiClient.post('/v1/auth/register', {
        email: formData.email,
        username: formData.email.split('@')[0], // Use email prefix as username
        full_name: formData.fullName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role || 'adopter',
      })

      // Registration successful, auto-login
      if (response.data) {
        // After registration, user needs to login
        return { success: true, message: 'Registration successful! Please log in.' }
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Login user
  const login = useCallback(async (email, password) => {
    try {
      setError(null)
      setLoading(true)

      const response = await apiClient.post('/v1/auth/login', {
        email,
        password,
      })

      const { access_token, user_id, email: userEmail, role } = response.data

      // Store token
      localStorage.setItem('auth_token', access_token)
      setToken(access_token)

      // Set user
      const userData = {
        id: user_id,
        email: userEmail,
        role,
      }
      setUser(userData)

      return userData
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed. Please try again.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  // Check if user has specific role
  const hasRole = useCallback(
    (role) => {
      if (!user) return false
      return user.role === role || user.role === 'admin'
    },
    [user]
  )

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles) => {
      if (!user) return false
      return roles.includes(user.role) || user.role === 'admin'
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      register,
      login,
      logout,
      refreshUser: () => (token ? fetchUserInfo(token) : Promise.resolve(null)),
      hasRole,
      hasAnyRole,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, loading, error, register, login, logout, fetchUserInfo, hasRole, hasAnyRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
