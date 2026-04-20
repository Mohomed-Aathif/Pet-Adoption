import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../services/api'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/v1/dashboard/summary')
      setSummary(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load admin dashboard')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button
          type="button"
          onClick={loadDashboard}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && summary && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Registered Users</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.registered_users ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Pet Listings</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.active_pet_listings ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Listing Approvals</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.pending_pet_listing_approvals ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Adoption Success Rate</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.platform_statistics?.adoption_success_rate ?? 0}%</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 font-medium text-gray-900 dark:text-white">Quick Access</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/users" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Manage Users</Link>
                <Link to="/admin/pets" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Manage Pets</Link>
                <Link to="/admin/requests" className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">View Requests</Link>
                <Link to="/admin/donations" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">View Donations</Link>
                <Link to="/admin/analytics" className="rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Open Analytics</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
