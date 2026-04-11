import { useEffect, useMemo, useState } from 'react'
import apiClient from '../../services/api'

const roleOptions = ['all', 'admin', 'adopter', 'owner', 'shelter']

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deletingUserId, setDeletingUserId] = useState(null)

  const loadUsers = async (selectedRole = roleFilter) => {
    try {
      setLoading(true)
      setError('')

      const endpoint =
        selectedRole === 'all'
          ? '/v1/admin/users?skip=0&limit=100'
          : `/v1/admin/users?skip=0&limit=100&role=${selectedRole}`

      const response = await apiClient.get(endpoint)
      const list = Array.isArray(response.data?.users) ? response.data.users : []
      setUsers(list)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load users'
      setError(message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers('all')
  }, [])

  const handleDeleteUser = async (user) => {
    const confirmed = globalThis.confirm(`Delete user ${user.email}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setDeletingUserId(user.id)
      setError('')
      await apiClient.delete(`/v1/admin/users/${user.id}`)
      await loadUsers(roleFilter)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete user'
      setError(message)
    } finally {
      setDeletingUserId(null)
    }
  }

  const userCount = useMemo(() => users.length, [users])
  
  const getDeleteButtonLabel = (user) => {
    if (user.role === 'admin') return 'Protected'
    if (deletingUserId === user.id) return 'Deleting...'
    return 'Delete'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            value={roleFilter}
            onChange={(e) => {
              const value = e.target.value
              setRoleFilter(value)
              loadUsers(value)
            }}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === 'all' ? 'All roles' : role}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadUsers(roleFilter)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        {loading && <p className="text-gray-600 dark:text-gray-300">Loading users...</p>}

        {!loading && error && (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        )}

        {!loading && !error && (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Total users shown: {userCount}
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100"
                    >
                      <td className="py-2 pr-4">{user.id}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4">{user.username}</td>
                      <td className="py-2 pr-4">{user.role}</td>
                      <td className="py-2 pr-4">{user.is_active ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUserId === user.id || user.role === 'admin'}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title={user.role === 'admin' ? 'Admin accounts cannot be deleted' : 'Delete user'}
                        >
                          {getDeleteButtonLabel(user)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <p className="mt-4 text-gray-600 dark:text-gray-300">No users found.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
