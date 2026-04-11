import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../services/api'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiClient.get('/v1/dashboard/summary')
        setSummary(response.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const role = user?.role || summary?.role || 'adopter'
  const displayName =
    summary?.profile_summary?.full_name ||
    user?.full_name ||
    user?.email?.split('@')[0] ||
    role.charAt(0).toUpperCase() + role.slice(1)

  const getRequestDetailsPath = (status) =>
    role === 'admin'
      ? `/admin/requests?status=${status}`
      : `/notifications?status=${status}`

  const renderRoleCards = () => {
    if (!summary) return null

    if (role === 'adopter') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.pending ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.approved ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Adoption History</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_history?.length ?? 0}</p>
          </div>
        </div>
      )
    }

    if (role === 'owner' || role === 'shelter') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.pending ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.approved ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Rejected Requests</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.rejected ?? 0}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Registered Users</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.registered_users ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Listings</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.active_pet_listings ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.totals?.pending_pet_listing_approvals ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Adoption Success Rate</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.platform_statistics?.adoption_success_rate ?? 0}%</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Welcome {displayName}</h1>
      </div>

      {loading && <p className="mb-8 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>}
      {!loading && error && <p className="mb-8 text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && renderRoleCards()}

      <div className="mb-12 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by breed, type, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/pets?search=${encodeURIComponent(query)}`)
            }
          }}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => navigate(`/pets?search=${encodeURIComponent(query)}`)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {!loading && !error && role === 'admin' && summary?.notes?.length > 0 && (
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {summary.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Quick Data</h2>
          <Link to="/pets" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Pending Requests', value: summary?.adoption_requests?.pending ?? 0, status: 'pending' },
            { title: 'Approved Requests', value: summary?.adoption_requests?.approved ?? 0, status: 'completed' },
            { title: 'Rejected Requests', value: summary?.adoption_requests?.rejected ?? 0, status: 'cancelled' },
          ].map((item) => (
            <div
              key={item.status}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">{item.value}</p>
                <div>
                  <button
                    onClick={() => navigate(getRequestDetailsPath(item.status))}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
