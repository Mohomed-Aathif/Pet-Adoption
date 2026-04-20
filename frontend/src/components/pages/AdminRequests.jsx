import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import apiClient from '../../services/api'

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()

  const statusFilter = useMemo(() => {
    const value = (searchParams.get('status') || '').toLowerCase()
    return ['pending', 'completed', 'cancelled'].includes(value) ? value : ''
  }, [searchParams])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const query = new URLSearchParams({ skip: '0', limit: '100' })
      if (statusFilter) {
        query.set('status', statusFilter)
      }
      const response = await apiClient.get(`/v1/adoptions/requests?${query.toString()}`)
      setRequests(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()

    const intervalId = setInterval(() => {
      loadRequests()
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [statusFilter])

  const getStatusBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (normalized === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }

  const getStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'completed') return 'Approved'
    if (normalized === 'cancelled') return 'Rejected'
    return 'Pending'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requests</h1>
          {statusFilter && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 capitalize">
              Showing {statusFilter} requests
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading requests...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <p className="text-gray-700 dark:text-gray-300">No requests found.</p>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-4">Request ID</th>
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">User Name</th>
                  <th className="py-2 pr-4">Pet ID</th>
                  <th className="py-2 pr-4">Pet Name</th>
                  <th className="py-2 pr-4">Pet Owner</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100">
                    <td className="py-2 pr-4">{item.id}</td>
                    <td className="py-2 pr-4">{item.user_id}</td>
                    <td className="py-2 pr-4">{item.user_name || '-'}</td>
                    <td className="py-2 pr-4">{item.pet_id}</td>
                    <td className="py-2 pr-4">{item.pet_name || '-'}</td>
                    <td className="py-2 pr-4">{item.pet_owner_name || '-'}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
