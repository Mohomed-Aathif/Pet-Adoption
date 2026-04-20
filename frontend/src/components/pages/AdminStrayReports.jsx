import { useEffect, useMemo, useState } from 'react'
import apiClient, { SERVER_URL } from '../../services/api'

const statusOptions = ['all', 'new', 'in_progress', 'resolved']

const statusBadgeMap = {
  new: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const statusLabelMap = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  return `${SERVER_URL}${imageUrl}`
}

export default function AdminStrayReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const loadReports = async (selectedStatus = statusFilter) => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({ skip: '0', limit: '100' })
      if (selectedStatus !== 'all') params.set('status', selectedStatus)

      const response = await apiClient.get(`/v1/stray-reports/admin?${params.toString()}`)
      const items = Array.isArray(response.data?.items) ? response.data.items : []
      setReports(items)

      if (selectedReport) {
        const matched = items.find((item) => item.id === selectedReport.id)
        setSelectedReport(matched || null)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load stray reports')
      setReports([])
      setSelectedReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports('all')
  }, [])

  const updateStatus = async (report, nextStatus) => {
    try {
      setUpdatingId(report.id)
      setError('')
      const response = await apiClient.put(`/v1/stray-reports/admin/${report.id}/status`, { status: nextStatus })
      const updated = response.data

      setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      if (selectedReport?.id === updated.id) {
        setSelectedReport(updated)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update report status')
    } finally {
      setUpdatingId(null)
    }
  }

  const totalCount = useMemo(() => reports.length, [reports])

  const getNextAction = (status) => {
    if (status === 'new') return { label: 'Mark In Progress', value: 'in_progress' }
    if (status === 'in_progress') return { label: 'Mark Resolved', value: 'resolved' }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stray Reports</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Review community reports and update rescue progress.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            value={statusFilter}
            onChange={(e) => {
              const next = e.target.value
              setStatusFilter(next)
              loadReports(next)
            }}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : statusLabelMap[status]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadReports(statusFilter)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {loading && <p className="text-gray-600 dark:text-gray-300">Loading stray reports...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Total reports shown: {totalCount}</p>

            {reports.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No stray reports found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      <th className="py-2 pr-4">Reporter Name</th>
                      <th className="py-2 pr-4">Contact Number</th>
                      <th className="py-2 pr-4">Location</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((item) => {
                      const action = getNextAction(item.status)

                      return (
                        <tr key={item.id} className="border-b border-gray-100 text-gray-800 dark:border-gray-800 dark:text-gray-100">
                          <td className="py-2 pr-4">{item.reporter_name}</td>
                          <td className="py-2 pr-4">{item.contact_number}</td>
                          <td className="py-2 pr-4">{item.location}</td>
                          <td className="py-2 pr-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeMap[item.status]}`}>
                              {statusLabelMap[item.status]}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{new Date(item.created_at).toLocaleDateString()}</td>
                          <td className="py-2 pr-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(item)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                              >
                                View Details
                              </button>

                              {action && (
                                <button
                                  type="button"
                                  disabled={updatingId === item.id}
                                  onClick={() => updateStatus(item, action.value)}
                                  className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {updatingId === item.id ? 'Updating...' : action.label}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {selectedReport && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Details</h2>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reporter Name</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.reporter_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Number</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.contact_number}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.location}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.description || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeMap[selectedReport.status]}`}>
                {statusLabelMap[selectedReport.status]}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Created At</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{new Date(selectedReport.created_at).toLocaleString()}</p>
            </div>
          </div>

          {getImageUrl(selectedReport.image_url) && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Image</p>
              <img
                src={getImageUrl(selectedReport.image_url)}
                alt="Stray report"
                className="h-48 w-full rounded-lg object-cover sm:h-64"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
