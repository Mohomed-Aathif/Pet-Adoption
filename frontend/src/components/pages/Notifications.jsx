import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../services/api'

export default function Notifications() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const role = user?.role || 'adopter'
  const viewFilter = useMemo(() => {
    const raw = (searchParams.get('view') || '').toLowerCase()
    return ['active', 'completed'].includes(raw) ? raw : ''
  }, [searchParams])

  const statusFilter = useMemo(() => {
    const raw = (searchParams.get('status') || '').toLowerCase()
    if (['pending', 'completed', 'cancelled', 'approved', 'rejected'].includes(raw)) {
      return raw
    }

    return ''
  }, [searchParams])

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true)
        setError('')

        // Adopter sees own requests, owner/shelter/admin sees requests endpoint
        const endpoint = role === 'adopter' ? '/v1/adoptions/me' : '/v1/adoptions/requests?skip=0&limit=100'
        const response = await apiClient.get(endpoint)
        setRequests(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load adoption activity')
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    loadRequests()

    const intervalId = setInterval(() => {
      loadRequests()
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [role])

  const title = useMemo(() => {
    if (role === 'adopter') return 'My Adoption Requests'
    if (role === 'admin') return 'All Adoption Requests'
    return 'Adoption Requests For My Pets'
  }, [role])

  const filteredRequests = useMemo(() => {
    let filtered = requests

    // Adopter sidebar grouping:
    // active => pending only
    // completed => approved(completed) + rejected(cancelled)
    if (role === 'adopter') {
      if (viewFilter === 'active') {
        filtered = filtered.filter((item) => (item.status || '').toLowerCase() === 'pending')
      } else if (viewFilter === 'completed') {
        filtered = filtered.filter((item) => {
          const status = (item.status || '').toLowerCase()
          return status === 'completed' || status === 'cancelled'
        })
      }
    }

    if (!statusFilter) return filtered

    const normalizedStatus =
      statusFilter === 'approved'
        ? 'completed'
        : statusFilter === 'rejected'
          ? 'cancelled'
          : statusFilter

    return filtered.filter((item) => (item.status || '').toLowerCase() === normalizedStatus)
  }, [requests, role, viewFilter, statusFilter])

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Stay up to date with recent account and adoption activity.</p>
      {(statusFilter || (role === 'adopter' && viewFilter)) && (
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 capitalize">
          {statusFilter
            ? `Showing ${statusFilter} requests only`
            : `Showing ${viewFilter} requests only`}
        </p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading adoption activity...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && filteredRequests.length === 0 && (
          <p className="text-gray-700 dark:text-gray-300">No adoption requests found.</p>
        )}

        {!loading && !error && filteredRequests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-4">Request ID</th>
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">User Name</th>
                  <th className="py-2 pr-4">Pet ID</th>
                  <th className="py-2 pr-4">Pet Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100">
                    <td className="py-2 pr-4">{item.id}</td>
                    <td className="py-2 pr-4">{item.user_id}</td>
                    <td className="py-2 pr-4">{item.user_name || '-'}</td>
                    <td className="py-2 pr-4">{item.pet_id}</td>
                    <td className="py-2 pr-4">{item.pet_name || '-'}</td>
                    <td className="py-2 pr-4 capitalize">{item.status}</td>
                    <td className="py-2 pr-4">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/pets')}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Browse Pets
        </button>
      </div>
    </div>
  )
}
