import { useEffect, useState } from 'react'
import { Save, Lock, RefreshCw } from 'lucide-react'
import apiClient from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const loadProfile = async () => {
    setIsLoading(true)
    setMessage('')
    setError('')
    try {
      const response = await apiClient.get('/v1/auth/me')
      const data = response.data || {}
      setProfileForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        bio: data.bio || '',
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      await apiClient.put('/v1/auth/me', profileForm)
      await refreshUser()
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setError('')
    setMessage('')

    try {
      await apiClient.post('/v1/auth/change-password', passwordForm)
      setMessage('Password changed successfully.')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and update your account information.
          </p>
        </div>
        <button
          type="button"
          onClick={loadProfile}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Edit your name, contact details, and bio.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="full_name">Name</label>
              <input
                id="full_name"
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="address">Address</label>
              <textarea
                id="address"
                rows={3}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                rows={4}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center dark:bg-gray-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your login password securely.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="current_password">Current Password</label>
              <input
                id="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
