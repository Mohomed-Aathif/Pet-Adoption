import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../services/api'

const getStatusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed') {
    return {
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
      icon: CheckCircle2,
      label: 'Approved',
    }
  }

  if (normalized === 'cancelled') {
    return {
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      icon: XCircle,
      label: 'Rejected',
    }
  }

  return {
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    icon: Clock3,
    label: 'Pending',
  }
}

const formatRelativeTime = (value) => {
  if (!value) return 'Just now'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Just now'

  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Notifications() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const role = user?.role || 'adopter'

  const statusFilter = useMemo(() => {
    const raw = String(searchParams.get('status') || '').toLowerCase()
    if (!raw) return ''
    if (raw === 'approved') return 'completed'
    if (raw === 'rejected') return 'cancelled'
    if (raw === 'pending' || raw === 'completed' || raw === 'cancelled') return raw
    return ''
  }, [searchParams])

  const viewFilter = useMemo(() => {
    const raw = String(searchParams.get('view') || '').toLowerCase()
    return raw === 'active' || raw === 'completed' ? raw : ''
  }, [searchParams])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const endpoint = role === 'adopter' ? '/v1/adoptions/me' : '/v1/adoptions/requests?skip=0&limit=100'
      const response = await apiClient.get(endpoint)
      setRequests(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load notifications')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    const intervalId = setInterval(() => {
      loadNotifications()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [role])

  const filteredRequests = useMemo(() => {
    let items = requests

    if (role === 'adopter') {
      if (viewFilter === 'active') {
        items = items.filter((item) => String(item?.status || '').toLowerCase() === 'pending')
      } else if (viewFilter === 'completed') {
        items = items.filter((item) => {
          const status = String(item?.status || '').toLowerCase()
          return status === 'completed' || status === 'cancelled'
        })
      }
    }

    if (statusFilter) {
      items = items.filter((item) => String(item?.status || '').toLowerCase() === statusFilter)
    }

    return items
  }, [requests, role, statusFilter, viewFilter])

  const notifications = useMemo(() => {
    const requestNotifications = filteredRequests.map((item) => {
      const statusTone = getStatusTone(item.status)
      const statusValue = String(item?.status || '').toLowerCase()

      let message = `Your request for ${item?.pet_name || `pet #${item?.pet_id}`} is pending review`

      if (role === 'owner') {
        message = `New request from ${item?.user_name || 'an adopter'} for ${item?.pet_name || `pet #${item?.pet_id}`}`
      }

      if (role === 'admin') {
        message = `Request #${item?.id} for ${item?.pet_name || `pet #${item?.pet_id}`} is ${statusTone.label.toLowerCase()}`
      }

      if (statusValue === 'completed' && role === 'adopter') {
        message = `Your request for ${item?.pet_name || `pet #${item?.pet_id}`} was approved`
      } else if (statusValue === 'cancelled' && role === 'adopter') {
        message = `Your request for ${item?.pet_name || `pet #${item?.pet_id}`} was rejected`
      }

      return {
        id: `request-${item.id}`,
        message,
        detail: `Request #${item.id}`,
        timestamp: item?.updated_at || item?.created_at,
        status: statusTone,
      }
    })

    const sorted = requestNotifications
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())

    return sorted
  }, [filteredRequests, role])

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
          <Bell className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Recent updates and alerts for your account.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading notifications...</p>}

        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">No notifications yet.</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">You will see adoption and request updates here.</p>
            <Link
              to="/pets"
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Pets
            </Link>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((item) => {
              const Icon = item.status.icon
              return (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:hover:border-blue-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex rounded-full p-1.5 ${item.status.badgeClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.message}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.detail} • {formatRelativeTime(item.timestamp)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status.badgeClass}`}>
                      {item.status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
