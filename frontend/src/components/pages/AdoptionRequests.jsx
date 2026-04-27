import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Eye, Pencil } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../services/api'

export default function AdoptionRequests() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [updatingRequestId, setUpdatingRequestId] = useState(null)
  const [deletingRequestId, setDeletingRequestId] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false)
  const [isEditScheduleMode, setIsEditScheduleMode] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState('')
  const [modalActionLoading, setModalActionLoading] = useState(false)
  const [isAdopterModalOpen, setIsAdopterModalOpen] = useState(false)
  const [adopterModalMode, setAdopterModalMode] = useState('view')
  const [adopterScheduleDate, setAdopterScheduleDate] = useState('')
  const [adopterScheduleTime, setAdopterScheduleTime] = useState('')

  const role = user?.role || 'adopter'

  const viewFilter = useMemo(() => {
    const raw = (searchParams.get('view') || '').toLowerCase()
    return ['active', 'completed'].includes(raw) ? raw : ''
  }, [searchParams])

  const statusFilter = useMemo(() => {
    const raw = (searchParams.get('status') || '').toLowerCase()
    if (['pending', 'approved', 'pickup_requested', 'pickup_scheduled', 'completed', 'cancelled', 'rejected'].includes(raw)) {
      return raw
    }

    return ''
  }, [searchParams])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')

      const endpoint = role === 'adopter' ? '/v1/adoptions/me' : '/v1/adoptions/requests?skip=0&limit=100'
      const response = await apiClient.get(endpoint)
      setRequests(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load adoption requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      setUpdatingRequestId(id)
      setError('')
      setActionMessage('')
      await apiClient.put(`/v1/adoptions/requests/${id}/status`, { status })
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update request status')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const deleteRequest = async (id) => {
    const confirmed = globalThis.confirm('Delete this adoption request?')
    if (!confirmed) return

    try {
      setDeletingRequestId(id)
      setError('')
      setActionMessage('')
      await apiClient.delete(`/v1/adoptions/requests/${id}`)
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete request')
    } finally {
      setDeletingRequestId(null)
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
  }, [role])

  const title = useMemo(() => {
    if (role === 'adopter') return 'My Adoption Requests'
    if (role === 'admin') return 'All Adoption Requests'
    return 'Adoption Requests For My Pets'
  }, [role])

  const filteredRequests = useMemo(() => {
    let filtered = requests

    if (role === 'adopter') {
      if (viewFilter === 'active') {
        filtered = filtered.filter((item) => {
          const status = (item.status || '').toLowerCase()
          return ['pending', 'approved', 'pickup_requested', 'pickup_scheduled'].includes(status)
        })
      } else if (viewFilter === 'completed') {
        filtered = filtered.filter((item) => {
          const status = (item.status || '').toLowerCase()
          return status === 'completed'
        })
      }
    }

    if (!statusFilter) return filtered

    let normalizedStatus = statusFilter === 'rejected' ? 'cancelled' : statusFilter

    if (role === 'owner' && normalizedStatus === 'approved') {
      return filtered.filter((item) => {
        const status = String(item.status || '').toLowerCase()
        return ['approved', 'pickup_requested', 'pickup_scheduled', 'completed', 'owner_marked_completed'].includes(status)
      })
    }

    return filtered.filter((item) => (item.status || '').toLowerCase() === normalizedStatus)
  }, [requests, role, viewFilter, statusFilter])

  const getStatusBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'approved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    if (normalized === 'pickup_scheduled') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    if (normalized === 'pickup_requested') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    if (normalized === 'owner_marked_completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (normalized === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (normalized === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }

  const getStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'approved') return 'Approved'
    if (normalized === 'pickup_requested') return 'Pickup Requested'
    if (normalized === 'pickup_scheduled') return 'Pickup Scheduled'
    if (normalized === 'owner_marked_completed') return 'Completed'
    if (normalized === 'completed') return 'Completed'
    if (normalized === 'cancelled') return 'Rejected'
    return 'Pending'
  }

  const normalizeStatus = (status) => String(status || '').toLowerCase()

  const getOwnerWorkflowStatus = (status) => {
    const normalized = normalizeStatus(status)
    if (normalized === 'owner_marked_completed' || normalized === 'completed') return 'completed'
    return normalized
  }

  const toDateTimeLocalValue = (value) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    const pad = (num) => String(num).padStart(2, '0')
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  }

  const toDateAndTimeParts = (value) => {
    const localValue = toDateTimeLocalValue(value)
    if (localValue?.includes('T') !== true) {
      return { date: '', time: '' }
    }

    const [date, time] = localValue.split('T')
    return { date, time }
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString()
  }

  const isWithinValidPickupHourRange = (value) => {
    const hour = value.getHours()
    return hour >= 6 && hour <= 22
  }

  const openAdopterModal = (request, mode = 'view') => {
    const sourceDateTime = request.pickup_requested_datetime || request.pickup_scheduled_datetime || request.pickup_suggested_datetime
    const dateTimeParts = toDateAndTimeParts(sourceDateTime)

    setSelectedRequest(request)
    setIsAdopterModalOpen(true)
    setAdopterModalMode(mode)
    setAdopterScheduleDate(dateTimeParts.date)
    setAdopterScheduleTime(dateTimeParts.time)
    setError('')
    setActionMessage('')
  }

  const closeAdopterModal = () => {
    setIsAdopterModalOpen(false)
    setAdopterModalMode('view')
    setSelectedRequest(null)
    setScheduleDraft('')
    setAdopterScheduleDate('')
    setAdopterScheduleTime('')
    setModalActionLoading(false)
  }

  const openPickupDetails = (request, startEdit = false) => {
    setSelectedRequest(request)
    setIsPickupModalOpen(true)
    setIsEditScheduleMode(startEdit)
    setScheduleDraft(toDateTimeLocalValue(request.pickup_suggested_datetime || request.pickup_requested_datetime || request.pickup_scheduled_datetime))
    setError('')
    setActionMessage('')
  }

  const closePickupModal = () => {
    setIsPickupModalOpen(false)
    setSelectedRequest(null)
    setIsEditScheduleMode(false)
    setScheduleDraft('')
    setModalActionLoading(false)
  }

  const confirmPickup = async () => {
    if (!selectedRequest) return

    try {
      setModalActionLoading(true)
      setError('')
      const response = await apiClient.put(`/v1/adoptions/requests/${selectedRequest.id}/status`, { status: 'pickup_scheduled' })
      const updatedRequest = response?.data
      if (updatedRequest?.id) {
        setSelectedRequest(updatedRequest)
      }
      setActionMessage('Pickup confirmed. Adopter has been notified.')
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to confirm pickup')
    } finally {
      setModalActionLoading(false)
    }
  }

  const saveEditedSchedule = async () => {
    if (!selectedRequest) return
    if (!scheduleDraft) {
      setError('Please choose a pickup date and time')
      return
    }

    const parsedDate = new Date(scheduleDraft)
    if (Number.isNaN(parsedDate.getTime())) {
      setError('Invalid pickup date and time')
      return
    }

    try {
      setModalActionLoading(true)
      setError('')
      const response = await apiClient.put(`/v1/adoptions/requests/${selectedRequest.id}/pickup-suggestion`, {
        pickup_datetime: parsedDate.toISOString(),
        notes: 'Owner updated pickup schedule.',
      })
      const updatedRequest = response?.data
      if (updatedRequest?.id) {
        setSelectedRequest(updatedRequest)
      }
      setIsEditScheduleMode(false)
      setActionMessage('Pickup schedule updated and sent to adopter.')
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update pickup schedule')
    } finally {
      setModalActionLoading(false)
    }
  }

  const markPickupCompleted = async (requestId = null) => {
    const id = requestId || selectedRequest?.id
    if (!id) return

    try {
      setModalActionLoading(true)
      setUpdatingRequestId(id)
      setError('')
      const response = await apiClient.post(`/v1/adoptions/requests/${id}/pickup-complete`, {
        status: 'completed',
        notes: 'Owner marked adoption as completed.',
      })
      const updatedRequest = response?.data
      if (updatedRequest?.id && selectedRequest?.id === updatedRequest.id) {
        setSelectedRequest(updatedRequest)
      }
      setActionMessage('Adoption marked as completed successfully.')
      await loadRequests()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark adoption as completed')
    } finally {
      setModalActionLoading(false)
      setUpdatingRequestId(null)
    }
  }

  const submitAdopterPickupSchedule = async () => {
    if (!selectedRequest) return

    if (!adopterScheduleDate || !adopterScheduleTime) {
      setError('Please select pickup date and pickup time')
      return
    }

    const parsedDate = new Date(`${adopterScheduleDate}T${adopterScheduleTime}`)
    if (Number.isNaN(parsedDate.getTime())) {
      setError('Invalid pickup date and time')
      return
    }

    if (parsedDate.getTime() <= Date.now()) {
      setError('Pickup schedule must be a future date and time')
      return
    }

    if (!isWithinValidPickupHourRange(parsedDate)) {
      setError('Pickup time must be between 06:00 and 22:59')
      return
    }

    const isEditing = adopterModalMode === 'edit'

    try {
      setModalActionLoading(true)
      setError('')
      const response = await apiClient.post(`/v1/adoptions/requests/${selectedRequest.id}/pickup-request`, {
        pickup_datetime: parsedDate.toISOString(),
        notes: isEditing ? 'Adopter updated pickup schedule.' : 'Adopter scheduled pickup.',
      })
      const updatedRequest = response?.data
      if (updatedRequest?.id) {
        setSelectedRequest(updatedRequest)
      }
      setActionMessage(
        isEditing
          ? 'Schedule updated, waiting for owner confirmation.'
          : 'Pickup scheduled successfully. Waiting for owner confirmation.'
      )
      await loadRequests()
      setAdopterModalMode('view')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit pickup schedule')
    } finally {
      setModalActionLoading(false)
    }
  }

  const acceptOwnerSuggestion = async () => {
    if (!selectedRequest) return

    try {
      setModalActionLoading(true)
      setError('')
      const response = await apiClient.post(`/v1/adoptions/requests/${selectedRequest.id}/pickup-suggestion/accept`)
      const updatedRequest = response?.data
      if (updatedRequest?.id) {
        setSelectedRequest(updatedRequest)
      }
      setActionMessage('Pickup schedule confirmed.')
      await loadRequests()
      setAdopterModalMode('view')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to confirm owner suggestion')
    } finally {
      setModalActionLoading(false)
    }
  }

  const renderAdopterActions = (item) => {
    const itemStatus = normalizeStatus(item.status)

    if (itemStatus === 'pending') {
      return (
        <button
          type="button"
          onClick={() => deleteRequest(item.id)}
          disabled={deletingRequestId === item.id}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {deletingRequestId === item.id ? 'Deleting...' : 'Delete'}
        </button>
      )
    }

    if (itemStatus === 'approved') {
      return (
        <button
          type="button"
          onClick={() => openAdopterModal(item, 'schedule')}
          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Schedule
        </button>
      )
    }

    if (['pickup_requested', 'pickup_scheduled'].includes(itemStatus)) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openAdopterModal(item, 'view')}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <button
            type="button"
            onClick={() => openAdopterModal(item, 'edit')}
            className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      )
    }

    if (itemStatus === 'completed') {
      return (
        <button
          type="button"
          onClick={() => openAdopterModal(item, 'view')}
          className="inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      )
    }

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
        {getStatusLabel(item.status)}
      </span>
    )
  }

  const getAdopterScheduleSubmitLabel = () => {
    if (modalActionLoading) return 'Submitting...'
    if (adopterModalMode === 'edit') return 'Update Schedule'
    return 'Schedule Pickup'
  }

  const renderOwnerActions = (item) => {
    const itemStatus = normalizeStatus(item.status)

    if (itemStatus === 'pending') {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateStatus(item.id, 'approved')}
            disabled={updatingRequestId === item.id}
            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => updateStatus(item.id, 'cancelled')}
            disabled={updatingRequestId === item.id}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Reject
          </button>
        </div>
      )
    }

    if (itemStatus === 'pickup_requested') {
      return (
        <button
          type="button"
          onClick={() => openPickupDetails(item)}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      )
    }

    if (itemStatus === 'pickup_scheduled') {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openPickupDetails(item)}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <button
            type="button"
            onClick={() => markPickupCompleted(item.id)}
            disabled={updatingRequestId === item.id}
            className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {updatingRequestId === item.id ? 'Completing...' : 'Complete'}
          </button>
        </div>
      )
    }

    if (['owner_marked_completed', 'completed'].includes(itemStatus)) {
      return (
        <button
          type="button"
          onClick={() => openPickupDetails(item)}
          className="inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      )
    }

    if (itemStatus === 'approved') {
      return <span className="text-xs text-gray-500 dark:text-gray-400">Waiting pickup request</span>
    }

    return <span className="text-xs text-gray-500 dark:text-gray-400">No actions</span>
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Track your adoption requests and review their latest status.</p>
      {(statusFilter || (role === 'adopter' && viewFilter)) && (
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 capitalize">
          {statusFilter
            ? `Showing ${statusFilter} requests only`
            : `Showing ${viewFilter} requests only`}
        </p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading adoption requests...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {!loading && !error && actionMessage && <p className="text-emerald-700 dark:text-emerald-300">{actionMessage}</p>}

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
                  {role === 'adopter' && <th className="py-2 pr-4">Actions</th>}
                  {role === 'owner' && <th className="py-2 pr-4">Actions</th>}
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
                    <td className="py-2 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{item.notes || '-'}</td>
                    {role === 'adopter' && (
                      <td className="py-2 pr-4">
                        {renderAdopterActions(item)}
                      </td>
                    )}
                    {role === 'owner' && (
                      <td className="py-2 pr-4">
                        {renderOwnerActions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {role === 'owner' && isPickupModalOpen && selectedRequest && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pickup Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage pickup scheduling and completion for this adoption.</p>
              </div>
              <button
                type="button"
                onClick={closePickupModal}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Adopter</p>
                <p className="font-medium">{selectedRequest.user_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pet</p>
                <p className="font-medium">{selectedRequest.pet_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Your Requested Date & Time</p>
                <p>{formatDateTime(selectedRequest.pickup_requested_datetime)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Scheduled Time</p>
                <p>{formatDateTime(selectedRequest.pickup_scheduled_datetime || selectedRequest.pickup_suggested_datetime)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Details</p>
                <p>
                  {selectedRequest.user_phone || 'No phone on file'}
                  {selectedRequest.user_email ? ` | ${selectedRequest.user_email}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(selectedRequest.status)}`}>
                {getStatusLabel(selectedRequest.status)}
              </span>
            </div>

            {getOwnerWorkflowStatus(selectedRequest.status) === 'pickup_requested' && (
              <div className="mt-5 space-y-4">
                {isEditScheduleMode && (
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <label htmlFor="pickup-schedule" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      New Pickup Date & Time
                    </label>
                    <input
                      id="pickup-schedule"
                      type="datetime-local"
                      value={scheduleDraft}
                      onChange={(event) => setScheduleDraft(event.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmPickup}
                    disabled={modalActionLoading}
                    className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {modalActionLoading ? 'Working...' : 'Confirm Pickup'}
                  </button>

                  {isEditScheduleMode ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEditedSchedule}
                        disabled={modalActionLoading}
                        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        Save Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditScheduleMode(false)
                          setScheduleDraft(toDateTimeLocalValue(selectedRequest.pickup_suggested_datetime || selectedRequest.pickup_requested_datetime || selectedRequest.pickup_scheduled_datetime))
                        }}
                        disabled={modalActionLoading}
                        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditScheduleMode(true)}
                      disabled={modalActionLoading}
                      className="inline-flex items-center gap-1 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Schedule
                    </button>
                  )}
                </div>
              </div>
            )}

            {getOwnerWorkflowStatus(selectedRequest.status) === 'pickup_scheduled' && (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markPickupCompleted()}
                  disabled={modalActionLoading}
                  className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {modalActionLoading ? 'Working...' : 'Mark as Completed'}
                </button>
              </div>
            )}

            {getOwnerWorkflowStatus(selectedRequest.status) === 'completed' && (
              <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">Adoption is completed. Details are now read-only.</p>
            )}
          </div>
        </dialog>
      )}

      {role === 'adopter' && isAdopterModalOpen && selectedRequest && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pickup Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Review pickup details and manage your pickup schedule.</p>
              </div>
              <button
                type="button"
                onClick={closeAdopterModal}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pet</p>
                <p className="font-medium">{selectedRequest.pet_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner</p>
                <p className="font-medium">{selectedRequest.pet_owner_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Your Requested Date & Time</p>
                <p>{formatDateTime(selectedRequest.pickup_requested_datetime)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Confirmed Date & Time</p>
                <p>{formatDateTime(selectedRequest.pickup_scheduled_datetime || selectedRequest.pickup_suggested_datetime)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner Contact</p>
                <p>{selectedRequest.pet_owner_phone || 'Not available yet'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner Address</p>
                <p>{selectedRequest.pet_owner_address || 'Not available yet'}</p>
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(selectedRequest.status)}`}>
                {getStatusLabel(selectedRequest.status)}
              </span>
            </div>

            {['schedule', 'edit'].includes(adopterModalMode) && (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <label htmlFor="adopter-pickup-schedule" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Pickup Date & Time
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      id="adopter-pickup-schedule"
                      type="date"
                      value={adopterScheduleDate}
                      onChange={(event) => setAdopterScheduleDate(event.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="time"
                      value={adopterScheduleTime}
                      onChange={(event) => setAdopterScheduleTime(event.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Allowed time range: 06:00 - 22:59, future dates only.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitAdopterPickupSchedule}
                    disabled={modalActionLoading}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {getAdopterScheduleSubmitLabel()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdopterModalMode('view')}
                    disabled={modalActionLoading}
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {adopterModalMode === 'view' && (
              <div className="mt-5 flex flex-wrap gap-2">
                {normalizeStatus(selectedRequest.status) === 'approved' && (
                  <button
                    type="button"
                    onClick={() => setAdopterModalMode('schedule')}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Schedule Pickup
                  </button>
                )}

                {['pickup_requested', 'pickup_scheduled'].includes(normalizeStatus(selectedRequest.status)) && (
                  <button
                    type="button"
                    onClick={() => setAdopterModalMode('edit')}
                    className="inline-flex items-center gap-1 rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Schedule
                  </button>
                )}

                {normalizeStatus(selectedRequest.status) === 'pickup_requested' && selectedRequest.pickup_suggested_datetime && (
                  <button
                    type="button"
                    onClick={acceptOwnerSuggestion}
                    disabled={modalActionLoading}
                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {modalActionLoading ? 'Working...' : 'Accept Owner Suggestion'}
                  </button>
                )}

                {normalizeStatus(selectedRequest.status) === 'completed' && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Adoption is completed. Details are read-only.</p>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">This adoption has been marked as completed by the owner.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </dialog>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate('/dashboard')}
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