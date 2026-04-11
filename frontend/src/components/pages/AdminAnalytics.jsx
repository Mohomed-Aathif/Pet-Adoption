import { useEffect, useState } from 'react'
import apiClient from '../../services/api'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/v1/dashboard/summary')
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading analytics...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && data && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <p>Adoption success rate: <strong>{data.platform_statistics?.adoption_success_rate ?? 0}%</strong></p>
            <p>Total adoption requests: <strong>{data.adoption_requests?.total ?? 0}</strong></p>
            <p>Pending requests: <strong>{data.adoption_requests?.pending ?? 0}</strong></p>
            <p>Approved requests: <strong>{data.adoption_requests?.approved ?? 0}</strong></p>
            <p>Rejected requests: <strong>{data.adoption_requests?.rejected ?? 0}</strong></p>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Most adopted pet types</p>
              <ul className="mt-2 space-y-1">
                {(data.platform_statistics?.most_adopted_pet_types || []).map((item) => (
                  <li key={item.species}>{item.species}: {item.count}</li>
                ))}
                {(data.platform_statistics?.most_adopted_pet_types || []).length === 0 && (
                  <li>No completed adoption records yet.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
