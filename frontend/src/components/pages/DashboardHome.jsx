import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Bell, CheckCircle2, Clock3, Heart, Mail, PawPrint } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import apiClient, { SERVER_URL } from '../../services/api'

const getStatusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed' || normalized === 'approved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  if (normalized === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  if (normalized === 'cancelled' || normalized === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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

const formatCurrency = (value) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(value || 0))

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (String(imageUrl).startsWith('http')) return imageUrl
  return `${SERVER_URL}${imageUrl}`
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [donations, setDonations] = useState([])
  const [adoptionRequests, setAdoptionRequests] = useState([])
  const [pets, setPets] = useState([])
  const [favoritePets, setFavoritePets] = useState([])
  const [adopterRequests, setAdopterRequests] = useState([])
  const [adopterPets, setAdopterPets] = useState([])
  const [ownerRequests, setOwnerRequests] = useState([])
  const [ownerPets, setOwnerPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const currentRole = String(user?.role || '').toLowerCase()

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      const summaryResponse = await apiClient.get('/v1/dashboard/summary')
      setSummary(summaryResponse.data)

      if (currentRole === 'admin') {
        const [donationResponse, requestsResponse, petsResponse] = await Promise.all([
          apiClient.get('/v1/donations/admin?skip=0&limit=50'),
          apiClient.get('/v1/adoptions/requests?skip=0&limit=100'),
          apiClient.get('/v1/pets'),
        ])

        setDonations(Array.isArray(donationResponse.data?.items) ? donationResponse.data.items : [])
        setAdoptionRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : [])
        setPets(Array.isArray(petsResponse.data) ? petsResponse.data : [])
        setFavoritePets([])
        setAdopterRequests([])
        setAdopterPets([])
        setOwnerRequests([])
        setOwnerPets([])
      } else if (currentRole === 'adopter') {
        const [favoritesResponse, adopterRequestsResponse, adopterPetsResponse] = await Promise.all([
          apiClient.get('/v1/favorites'),
          apiClient.get('/v1/adoptions/me'),
          apiClient.get('/v1/pets'),
        ])

        setDonations([])
        setAdoptionRequests([])
        setPets([])
        setFavoritePets(Array.isArray(favoritesResponse.data) ? favoritesResponse.data : [])
        setAdopterRequests(Array.isArray(adopterRequestsResponse.data) ? adopterRequestsResponse.data : [])
        setAdopterPets(Array.isArray(adopterPetsResponse.data) ? adopterPetsResponse.data : [])
        setOwnerRequests([])
        setOwnerPets([])
      } else if (currentRole === 'owner') {
        const [ownerRequestsResponse, ownerPetsResponse] = await Promise.all([
          apiClient.get('/v1/adoptions/requests?skip=0&limit=200'),
          apiClient.get('/v1/pets'),
        ])

        const allPets = Array.isArray(ownerPetsResponse.data) ? ownerPetsResponse.data : []
        const myPets = allPets.filter((pet) => Number(pet?.owner_id) === Number(user?.id))

        setDonations([])
        setAdoptionRequests([])
        setPets([])
        setFavoritePets([])
        setAdopterRequests([])
        setAdopterPets([])
        setOwnerRequests(Array.isArray(ownerRequestsResponse.data) ? ownerRequestsResponse.data : [])
        setOwnerPets(myPets)
      } else {
        setDonations([])
        setAdoptionRequests([])
        setPets([])
        setFavoritePets([])
        setAdopterRequests([])
        setAdopterPets([])
        setOwnerRequests([])
        setOwnerPets([])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard')
      setSummary(null)
      setDonations([])
      setAdoptionRequests([])
      setPets([])
      setFavoritePets([])
      setAdopterRequests([])
      setAdopterPets([])
      setOwnerRequests([])
      setOwnerPets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [currentRole])

  const welcomeName = useMemo(() => {
    const fullName = summary?.profile_summary?.full_name || user?.full_name
    if (fullName && String(fullName).trim()) {
      return String(fullName).trim()
    }

    const username = summary?.profile_summary?.username || user?.username
    if (username && String(username).trim()) {
      return String(username).trim()
    }

    const email = summary?.profile_summary?.email || user?.email
    if (email && String(email).includes('@')) {
      return String(email).split('@')[0]
    }

    return 'User'
  }, [summary?.profile_summary?.email, summary?.profile_summary?.full_name, summary?.profile_summary?.username, user?.email, user?.full_name, user?.username])

  const adminPendingRequests = useMemo(
    () => adoptionRequests.filter((item) => String(item?.status || '').toLowerCase() === 'pending'),
    [adoptionRequests]
  )

  const pendingListings = useMemo(
    () => pets.filter((pet) => String(pet?.status?.value || pet?.status || '').toLowerCase() === 'pending'),
    [pets]
  )

  const todayKey = new Date().toISOString().slice(0, 10)

  const highlights = useMemo(() => {
    const adoptionsToday = adoptionRequests.filter((item) => {
      const createdAt = String(item?.created_at || '')
      return createdAt.startsWith(todayKey)
    }).length

    const newUsersToday = Array.isArray(summary?.recent_activity?.new_users)
      ? summary.recent_activity.new_users.filter((item) => String(item?.created_at || '').startsWith(todayKey)).length
      : 0

    const donationsToday = donations.filter((item) => String(item?.donation_date || '').startsWith(todayKey)).reduce((sum, item) => sum + Number(item?.amount || 0), 0)

    return {
      adoptionsToday,
      newUsersToday,
      donationsToday,
    }
  }, [adoptionRequests, donations, summary?.recent_activity?.new_users, todayKey])

  const recentActivity = useMemo(() => {
    const items = []

    for (const userItem of summary?.recent_activity?.new_users || []) {
      items.push({
        id: `user-${userItem.id}`,
        message: `${userItem.email || userItem.id} joined the system`,
        timestamp: userItem.created_at,
        tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
      })
    }

    for (const listing of summary?.recent_activity?.new_listings || []) {
      items.push({
        id: `listing-${listing.id}`,
        message: `New pet '${listing.name || 'Unnamed'}' added`,
        timestamp: listing.created_at,
        tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      })
    }

    for (const request of summary?.recent_activity?.recent_adoptions || []) {
      items.push({
        id: `request-${request.id}`,
        message: `Adoption request #${request.id} updated to ${request.status || 'pending'}`,
        timestamp: request.created_at,
        tone: getStatusTone(request.status),
      })
    }

    for (const donation of donations.slice(0, 5)) {
      items.push({
        id: `donation-${donation.id}`,
        message: `Donation of ${formatCurrency(donation.amount)} received`,
        timestamp: `${donation.donation_date}T${donation.donation_time}`,
        tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
      })
    }

    return items
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 8)
  }, [donations, summary?.recent_activity])

  const handleRequestAction = async (adoptionId, status) => {
    try {
      setActionLoadingId(adoptionId)
      await apiClient.put(`/v1/adoptions/requests/${adoptionId}/status`, { status })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update request')
    } finally {
      setActionLoadingId(null)
    }
  }

  const adopterRequestCounts = useMemo(() => {
    const pending = adopterRequests.filter((item) => String(item?.status || '').toLowerCase() === 'pending').length
    const approved = adopterRequests.filter((item) => String(item?.status || '').toLowerCase() === 'completed').length
    const rejected = adopterRequests.filter((item) => String(item?.status || '').toLowerCase() === 'cancelled').length

    return {
      total: adopterRequests.length,
      pending,
      approved,
      rejected,
    }
  }, [adopterRequests])

  const adopterWeeklyRequests = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return adopterRequests.filter((item) => {
      const created = new Date(item?.created_at || '').getTime()
      return !Number.isNaN(created) && created >= weekAgo
    }).length
  }, [adopterRequests])

  const adopterFavoriteSpecies = useMemo(() => {
    return new Set(favoritePets.map((pet) => String(pet?.species || '').toLowerCase()).filter(Boolean))
  }, [favoritePets])

  const recommendedPets = useMemo(() => {
    const favoritePetIds = new Set(favoritePets.map((pet) => pet.id))

    const availablePets = adopterPets.filter((pet) => {
      const status = String(pet?.status?.value || pet?.status || '').toLowerCase()
      return status === 'available'
    })

    const sorted = [...availablePets].sort((left, right) => {
      const leftSpeciesPriority = adopterFavoriteSpecies.has(String(left?.species || '').toLowerCase()) ? 1 : 0
      const rightSpeciesPriority = adopterFavoriteSpecies.has(String(right?.species || '').toLowerCase()) ? 1 : 0

      if (leftSpeciesPriority !== rightSpeciesPriority) {
        return rightSpeciesPriority - leftSpeciesPriority
      }

      const leftCreated = new Date(left?.created_at || 0).getTime()
      const rightCreated = new Date(right?.created_at || 0).getTime()
      return rightCreated - leftCreated
    })

    return sorted.filter((pet) => !favoritePetIds.has(pet.id)).slice(0, 4)
  }, [adopterFavoriteSpecies, adopterPets, favoritePets])

  const adopterNotifications = useMemo(() => {
    const updates = adopterRequests
      .map((request) => {
        const normalized = String(request?.status || '').toLowerCase()
        let message = `Your request for ${request?.pet_name || 'a pet'} is pending review`

        if (normalized === 'completed') {
          message = `Your request for ${request?.pet_name || 'a pet'} was approved`
        } else if (normalized === 'cancelled') {
          message = `Your request for ${request?.pet_name || 'a pet'} was rejected`
        }

        return {
          id: `request-update-${request.id}`,
          message,
          timestamp: request?.updated_at || request?.created_at,
        }
      })
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 3)

    if (recommendedPets.length > 0) {
      updates.push({
        id: 'new-pets',
        message: `${recommendedPets.length} new pets are available near you`,
        timestamp: new Date().toISOString(),
      })
    }

    return updates.slice(0, 4)
  }, [adopterRequests, recommendedPets.length])

  const ownerCounts = useMemo(() => {
    const pendingRequests = ownerRequests.filter((item) => String(item?.status || '').toLowerCase() === 'pending').length
    const totalRequests = ownerRequests.length
    const activeListings = ownerPets.filter((pet) => String(pet?.status?.value || pet?.status || '').toLowerCase() === 'available').length

    return {
      myPets: ownerPets.length,
      activeListings,
      totalRequests,
      pendingRequests,
    }
  }, [ownerPets, ownerRequests])

  const ownerMostRequestedPet = useMemo(() => {
    if (ownerRequests.length === 0) return null

    const counts = new Map()
    for (const request of ownerRequests) {
      const key = request.pet_id
      const name = request.pet_name || `Pet #${request.pet_id}`
      const current = counts.get(key) || { petId: key, petName: name, count: 0 }
      counts.set(key, { ...current, count: current.count + 1 })
    }

    let best = null
    for (const item of counts.values()) {
      if (!best || item.count > best.count) best = item
    }

    return best
  }, [ownerRequests])

  const ownerRequestInsights = useMemo(() => {
    const counts = new Map()

    for (const request of ownerRequests) {
      const key = request.pet_id
      const name = request.pet_name || `Pet #${request.pet_id}`
      const current = counts.get(key) || { petId: key, petName: name, count: 0 }
      counts.set(key, { ...current, count: current.count + 1 })
    }

    return [...counts.values()].sort((left, right) => right.count - left.count).slice(0, 4)
  }, [ownerRequests])

  const ownerMostRequestedPetCard = useMemo(() => {
    if (!ownerMostRequestedPet) return null

    const linkedPet = ownerPets.find((pet) => Number(pet?.id) === Number(ownerMostRequestedPet.petId))
    return {
      ...ownerMostRequestedPet,
      imageUrl: linkedPet?.image_url || null,
      species: linkedPet?.species || null,
    }
  }, [ownerMostRequestedPet, ownerPets])

  const ownerNotifications = useMemo(() => {
    const updates = ownerRequests
      .map((request) => {
        const status = String(request?.status || '').toLowerCase()
        let message = `New request received for ${request?.pet_name || 'your pet'}`

        if (status === 'completed') {
          message = `${request?.pet_name || 'Your pet'} was adopted`
        } else if (status === 'cancelled') {
          message = `A request was rejected for ${request?.pet_name || 'your pet'}`
        }

        return {
          id: `owner-notification-${request.id}`,
          message,
          timestamp: request?.updated_at || request?.created_at,
        }
      })
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())

    return updates.slice(0, 4)
  }, [ownerRequests])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-fade-in flex items-center justify-between gap-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome {welcomeName}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">A quick read on what needs attention right now.</p>
        </div>
        <div className="flex items-center gap-2">
          {summary?.role === 'owner' && (
            <Link
              to="/pets?view=my"
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              + Add New Pet
            </Link>
          )}
          <span className="rounded-full border border-violet-200 bg-violet-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 shadow-sm shadow-violet-500/10 dark:border-violet-800/60 dark:bg-violet-900/30 dark:text-violet-200">
            {summary?.role || user.role}
          </span>
        </div>
      </div>

      <div className="dashboard-shell rounded-[2rem] p-4 sm:p-5">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && summary && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="dashboard-panel dashboard-fade-in rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {summary.role === 'adopter' ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">Your Adoption Journey 🐾</p>
                      <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Track your requests and discover new pets</h2>
                    </>
                  ) : summary.role === 'owner' ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Manage Your Pets 🐾</p>
                      <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Track your listings and respond to adoption requests</h2>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Control Center</p>
                      <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">What needs action right now</h2>
                    </>
                  )}
                </div>
                {summary.role === 'admin' && (
                  <div className="rounded-full border border-amber-200 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm shadow-amber-500/10 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200">
                    {adminPendingRequests.length + pendingListings.length} items need review
                  </div>
                )}
              </div>
            </div>

            {summary.role === 'adopter' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="dashboard-kpi rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-200">Requests Sent</p>
                    <Mail className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-200">{adopterRequestCounts.total}</p>
                  <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-300">+{adopterWeeklyRequests} this week</p>
                </div>

                <div className="dashboard-kpi rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-200">Pending Requests</p>
                    <Clock3 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-200">{adopterRequestCounts.pending}</p>
                  <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-300">Awaiting pet owner decision</p>
                </div>

                <div className="dashboard-kpi rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-200">Approved Requests</p>
                    <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-200">{adopterRequestCounts.approved}</p>
                  <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-300">Great progress on your journey</p>
                </div>

                <div className="dashboard-kpi rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-200">Favorite Pets</p>
                    <Heart className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-200">{favoritePets.length}</p>
                  <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-300">Saved pets you love</p>
                </div>
              </div>
            ) : summary.role === 'owner' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-800/60 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-200">My Pets</p>
                    <PawPrint className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-200">{ownerCounts.myPets}</p>
                  <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300">Pets currently under your care</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-800/60 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Active Listings</p>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-200">{ownerCounts.activeListings}</p>
                  <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300">Pets currently visible to adopters</p>
                </div>

                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-teal-800/60 dark:bg-teal-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-200">Adoption Requests Received</p>
                    <Mail className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-teal-700 dark:text-teal-200">{ownerCounts.totalRequests}</p>
                  <p className="mt-1 text-xs text-teal-700/80 dark:text-teal-300">Total requests across your pets</p>
                </div>

                <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-lime-800/60 dark:bg-lime-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-lime-700 dark:text-lime-200">Pending Requests</p>
                    <Clock3 className="h-4 w-4 text-lime-600 dark:text-lime-300" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-lime-700 dark:text-lime-200">{ownerCounts.pendingRequests}</p>
                  <p className="mt-1 text-xs text-lime-700/80 dark:text-lime-300">+{ownerCounts.pendingRequests > 0 ? 1 : 0} new request</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Requests</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.adoption_requests?.total ?? 0}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">+{summary.adoption_requests?.pending ?? 0} waiting</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Requests</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">{summary.adoption_requests?.pending ?? 0}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requires review</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Listings</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{summary.totals?.active_pet_listings ?? 0}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Live and visible now</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Registered Users</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">{summary.totals?.registered_users ?? 0}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">+{highlights.newUsersToday} today</p>
                </div>
              </div>
            )}

            {summary.role === 'admin' && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800 xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Actions</p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review requests and listings</h3>
                    </div>
                    <Link to="/admin/requests" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
                      View All Requests
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {adminPendingRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="dashboard-lift flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:hover:border-amber-700 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{request.pet_name || 'Unknown pet'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Requested by {request.user_name || 'Unknown user'}</p>
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(request.status)}`}>
                            Pending
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, 'completed')}
                            disabled={actionLoadingId === request.id}
                            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, 'cancelled')}
                            disabled={actionLoadingId === request.id}
                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingListings.slice(0, 2).map((pet) => (
                      <div key={pet.id} className="dashboard-lift flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{pet.name || 'Unnamed pet'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pending listing approval</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Pending</span>
                      </div>
                    ))}

                    {adminPendingRequests.length === 0 && pendingListings.length === 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No urgent pending actions right now.</p>
                    )}
                  </div>
                </div>

                <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">System Highlights</p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Today at a glance</h3>

                  <div className="mt-4 space-y-3">
                    <div className="dashboard-surface rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                      <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Adoptions today</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-200">{highlights.adoptionsToday}</p>
                    </div>
                    <div className="dashboard-surface rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200">New users today</p>
                      <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-200">{highlights.newUsersToday}</p>
                    </div>
                    <div className="dashboard-surface rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                      <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-200">Donations today</p>
                      <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-200">{formatCurrency(highlights.donationsToday)}</p>
                    </div>
                    <div className="dashboard-surface rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                      <p className="text-xs uppercase tracking-wide text-red-700 dark:text-red-200">Attention</p>
                      <p className="mt-1 text-base font-semibold text-red-700 dark:text-red-200">
                        {adminPendingRequests.length + pendingListings.length > 0
                          ? `${adminPendingRequests.length + pendingListings.length} items need review`
                          : 'No urgent items at the moment'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {summary.role === 'admin' && (
              <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Activity</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Latest system updates</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Auto-updated</span>
                </div>

                <div className="space-y-3">
                  {recentActivity.length > 0 ? recentActivity.map((item) => (
                    <div key={item.id} className="dashboard-lift flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                      <span className={`mt-0.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>Live</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity to show yet.</p>
                  )}
                </div>
              </div>
            )}

            {summary.role === 'owner' && (
              <div className="space-y-4">
                <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">My Pets</p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage your pet listings</h3>
                    </div>
                    <Link to="/pets?view=my" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
                      View All Pets
                    </Link>
                  </div>

                  {ownerPets.length === 0 ? (
                    <div className="dashboard-surface rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">You haven&apos;t added any pets yet</p>
                      <Link
                        to="/pets?view=my"
                        className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        View All Pets
                      </Link>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {ownerPets.slice(0, 3).map((pet) => {
                        const petStatus = String(pet?.status?.value || pet?.status || '').toLowerCase()
                        const statusLabel = petStatus === 'adopted' ? 'Adopted' : 'Available'

                        return (
                          <div key={pet.id} className="dashboard-lift rounded-xl border border-gray-200 p-3 transition duration-200 hover:scale-[1.01] hover:border-emerald-300 dark:border-gray-800 dark:hover:border-emerald-700">
                            <div className="mb-2 flex items-center gap-3">
                              {getImageUrl(pet.image_url) ? (
                                <img src={getImageUrl(pet.image_url)} alt={pet.name || 'Pet'} className="h-16 w-16 rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100 text-xl dark:bg-emerald-900/30">🐾</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-gray-900 dark:text-white">{pet.name || `Pet #${pet.id}`}</p>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{pet.species || 'Pet type not set'}</p>
                                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${petStatus === 'adopted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {ownerPets.length > 3 && (
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Showing 3 pets in preview.</p>
                    )}
                    <Link
                      to="/pets?view=my"
                      className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20"
                    >
                      View All Pets &rarr;
                    </Link>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                  <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800 xl:col-span-3">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Adoption Requests</p>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Respond quickly to incoming requests</h3>
                      </div>
                    </div>

                    {ownerRequests.length === 0 ? (
                      <p className="dashboard-surface rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">No adoption requests yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300">
                              <th className="py-2 pr-4">Pet Name</th>
                              <th className="py-2 pr-4">Adopter Name</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ownerRequests.slice(0, 8).map((item) => (
                              <tr key={item.id} className="border-b border-gray-100 text-gray-800 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-800/40">
                                <td className="py-2 pr-4">{item.pet_name || `Pet #${item.pet_id}`}</td>
                                <td className="py-2 pr-4">{item.user_name || '-'}</td>
                                <td className="py-2 pr-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}>
                                    {String(item.status || '').toLowerCase() === 'completed'
                                      ? 'Approved'
                                      : String(item.status || '').toLowerCase() === 'cancelled'
                                        ? 'Rejected'
                                        : 'Pending'}
                                  </span>
                                </td>
                                <td className="py-2 pr-4">{new Date(item?.adoption_date || item?.created_at || Date.now()).toLocaleDateString()}</td>
                                <td className="py-2 pr-4">
                                  {String(item.status || '').toLowerCase() === 'pending' ? (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleRequestAction(item.id, 'completed')}
                                        disabled={actionLoadingId === item.id}
                                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-gray-400"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRequestAction(item.id, 'cancelled')}
                                        disabled={actionLoadingId === item.id}
                                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-gray-400"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}>
                                      {String(item.status || '').toLowerCase() === 'completed' ? 'Approved' : 'Rejected'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 xl:col-span-2">
                    <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pet Performance Insights</p>
                      <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-white">Lightweight insights</h3>

                      <div className="mt-3 space-y-3">
                        <div className="dashboard-surface rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Most requested pet</p>
                          {ownerMostRequestedPetCard ? (
                            <div className="mt-2 flex items-center gap-3">
                              {getImageUrl(ownerMostRequestedPetCard.imageUrl) ? (
                                <img
                                  src={getImageUrl(ownerMostRequestedPetCard.imageUrl)}
                                  alt={ownerMostRequestedPetCard.petName}
                                  className="h-11 w-11 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-lg dark:bg-emerald-900/30">🐾</div>
                              )}
                              <div>
                                <p className="font-semibold text-emerald-700 dark:text-emerald-200">{ownerMostRequestedPetCard.petName}</p>
                                <p className="text-xs text-emerald-700/80 dark:text-emerald-300">{ownerMostRequestedPetCard.count} requests</p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-200">No requests yet</p>
                          )}
                        </div>

                        <div className="dashboard-surface rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Requests per pet</p>
                          {ownerRequestInsights.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">No request data yet.</p>
                          ) : (
                            <ul className="space-y-1 text-sm">
                              {ownerRequestInsights.map((insight) => (
                                <li key={insight.petId} className="flex items-center justify-between gap-3">
                                  <span className="truncate text-gray-700 dark:text-gray-300">{insight.petName}</span>
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{insight.count}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="mb-3 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notifications</p>
                      </div>

                      {ownerNotifications.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">No notifications yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {ownerNotifications.map((item) => (
                            <div key={item.id} className="dashboard-lift rounded-xl border border-gray-200 p-3 dark:border-gray-800 dark:hover:border-blue-700">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.message}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {summary.role === 'adopter' && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Adoption Activity</p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Your latest request updates</h3>

                  {adopterRequests.length === 0 ? (
                    <div className="dashboard-surface mt-4 rounded-xl border border-dashed border-sky-300 bg-sky-50 p-5 dark:border-sky-800 dark:bg-sky-900/20">
                      <p className="text-sm font-medium text-sky-800 dark:text-sky-200">You haven&apos;t made any requests yet</p>
                      <Link
                        to="/pets"
                        className="mt-3 inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                      >
                        Browse Pets
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {adopterRequests.slice(0, 5).map((item) => (
                        <div key={item.id} className="dashboard-lift flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:hover:border-sky-700 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{item.pet_name || `Pet #${item.pet_id}`}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item?.adoption_date || item?.created_at || Date.now()).toLocaleDateString()}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}>
                            {String(item.status || '').toLowerCase() === 'completed'
                              ? 'Approved'
                              : String(item.status || '').toLowerCase() === 'cancelled'
                                ? 'Rejected'
                                : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notifications</p>
                    </div>

                    {adopterNotifications.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No notifications yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {adopterNotifications.map((item) => (
                          <div key={item.id} className="dashboard-surface rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.message}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="dashboard-panel dashboard-section rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="mb-3 flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recommended Pets</p>
                    </div>

                    {recommendedPets.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No recommendations yet. Browse pets to build your preferences.</p>
                    ) : (
                      <div className="space-y-3">
                        {recommendedPets.map((pet) => (
                          <div key={pet.id} className="dashboard-lift rounded-xl border border-gray-200 p-3 dark:border-gray-800 dark:hover:border-emerald-700">
                            <div className="flex items-center gap-3">
                              {getImageUrl(pet.image_url) ? (
                                <img src={getImageUrl(pet.image_url)} alt={pet.name} className="h-12 w-12 rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-xl dark:bg-emerald-900/30">🐾</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-gray-900 dark:text-white">{pet.name}</p>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{pet.species || 'Pet'} • {pet.breed || 'Unknown breed'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Link to="/pets" className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
                          Browse more pets
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
