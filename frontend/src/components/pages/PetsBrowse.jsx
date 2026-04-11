import { useEffect, useMemo, useState } from 'react'
import { Heart, Filter, Grid, List, Plus, X, Upload } from 'lucide-react'
import apiClient, { uploadFile, SERVER_URL } from '../../services/api'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AGE_STORAGE_OFFSET = 10000

const mapSpeciesToType = (species) => {
  const normalized = String(species || '').toLowerCase()
  if (normalized === 'cat') return 'cats'
  if (normalized === 'bird') return 'birds'
  if (normalized === 'rabbit') return 'rabbits'
  return 'dogs'
}

const decodeAgeToMonths = (rawAge) => {
  if (rawAge === null || rawAge === undefined || rawAge === '') return null

  const numericAge = Number(rawAge)
  if (!Number.isFinite(numericAge)) return null

  // New format: encoded total months with an offset.
  if (numericAge >= AGE_STORAGE_OFFSET) {
    return numericAge - AGE_STORAGE_OFFSET
  }

  // Legacy format: age stored as years.
  return numericAge * 12
}

const formatAgeLabel = (rawAge) => {
  const totalMonths = decodeAgeToMonths(rawAge)
  if (totalMonths === null) return 'Unknown'

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0 && months > 0) {
    return `${months} month${months === 1 ? '' : 's'}`
  }

  if (years > 0 && months === 0) {
    return `${years} year${years === 1 ? '' : 's'}`
  }

  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`
}

const getAgeCategory = (rawAge) => {
  const totalMonths = decodeAgeToMonths(rawAge)
  if (totalMonths === null) return 'unknown'
  if (totalMonths <= 6) return 'baby'
  if (totalMonths <= 24) return 'junior'
  if (totalMonths <= 72) return 'adult'
  if (totalMonths <= 120) return 'mature'
  if (totalMonths <= 168) return 'senior'
  return 'super_senior'
}

const splitAgeParts = (rawAge) => {
  const totalMonths = decodeAgeToMonths(rawAge) ?? 0
  return {
    years: String(Math.floor(totalMonths / 12)),
    months: String(totalMonths % 12),
  }
}

const toUiPet = (pet) => ({
  id: pet.id,
  owner_id: pet.owner_id ?? null,
  name: pet.name || 'Pet',
  type: mapSpeciesToType(pet.species),
  age: formatAgeLabel(pet.age),
  ageRaw: pet.age,
  ageCategory: getAgeCategory(pet.age),
  size: pet.size || 'medium',
  breed: pet.breed || 'Unknown Breed',
  species: pet.species,
  status: pet.status,
  description: pet.description,
  image_url: pet.image_url,
})

export default function PetsBrowse() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const listingView = (searchParams.get('view') || '').toLowerCase()
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [apiPets, setApiPets] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)
  const [isEditingPet, setIsEditingPet] = useState(false)
  const [savingPetEdits, setSavingPetEdits] = useState(false)
  const [deletingPet, setDeletingPet] = useState(false)
  const [editPetError, setEditPetError] = useState('')
  const [editPetForm, setEditPetForm] = useState({
    name: '',
    breed: '',
    description: '',
    ageYears: '0',
    ageMonths: '0',
  })
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    age: 'all'
  })
  const [requestingPetId, setRequestingPetId] = useState(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [favorites, setFavorites] = useState(new Set())
  const [favoriteLoading, setFavoriteLoading] = useState(new Set())

  const canAddPets = ['admin', 'owner', 'shelter'].includes(user?.role)
  const canRequestAdoption = user?.role === 'adopter'
  const isMyPetsView = (user?.role === 'owner' || user?.role === 'shelter') && listingView === 'my'
  const canManageSelectedPet = !!(
    selectedPet &&
    user &&
    (user.role === 'admin' || selectedPet.owner_id === user.id)
  )

  const petTypes = [
    { id: 'all', label: 'All' },
    { id: 'dogs', label: 'Dogs' },
    { id: 'cats', label: 'Cats' },
    { id: 'birds', label: 'Birds' },
    { id: 'rabbits', label: 'Rabbits' }
  ]

  const ageRanges = [
    { id: 'all', label: 'All Ages' },
    { id: 'baby', label: 'Baby (0-6 months)' },
    { id: 'junior', label: 'Junior (7 months - 2 years)' },
    { id: 'adult', label: 'Adult (3 - 6 years)' },
    { id: 'mature', label: 'Mature (7 - 10 years)' },
    { id: 'senior', label: 'Senior (11 - 14 years)' },
    { id: 'super_senior', label: 'Super Senior (15+ years)' }
  ]

  const speciesEmojis = {
    dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐰', fish: '🐟',
    hamster: '🐹', turtle: '🐢', snake: '🐍',
  }

  const getEmoji = (species) => {
    if (!species) return '🐾'
    const key = species.toLowerCase()
    return speciesEmojis[key] || '🐾'
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    // If it's already an absolute URL, return as-is
    if (imageUrl.startsWith('http')) return imageUrl
    // Otherwise prepend the server URL
    return `${SERVER_URL}${imageUrl}`
  }

  const fetchPets = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/v1/pets')
      if (Array.isArray(response.data)) {
        setApiPets(response.data)
      }
    } catch {
      setApiPets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get('/v1/pets')
        if (isMounted && Array.isArray(response.data)) {
          setApiPets(response.data)
        }
      } catch (err) {
        console.error('Failed to load pets:', err)
        if (isMounted) {
          setApiPets([])
        }
      }

      // Load favorites only for adopters (separately, so failures don't affect pets)
      if (user?.role === 'adopter') {
        try {
          const favResponse = await apiClient.get('/v1/favorites')
          if (isMounted && Array.isArray(favResponse.data)) {
            const favIds = new Set(favResponse.data.map(pet => pet.id))
            setFavorites(favIds)
          }
        } catch (err) {
          console.error('Failed to load favorites:', err)
          if (isMounted) {
            setFavorites(new Set())
          }
        }
      }

      if (isMounted) setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [user?.role])

  const sourcePets = useMemo(() => {
    const petsToShow = isMyPetsView
      ? apiPets.filter((pet) => pet.owner_id === user?.id)
      : apiPets.filter((pet) => {
          const status = pet?.status?.value || pet?.status
          return String(status || '').toLowerCase() === 'available'
        })

    return petsToShow.map((pet) => toUiPet(pet))
  }, [apiPets, isMyPetsView, user?.id])

  const closePetDetails = () => {
    setSelectedPet(null)
    setIsEditingPet(false)
    setSavingPetEdits(false)
    setDeletingPet(false)
    setEditPetError('')
  }

  const startEditingPet = (pet) => {
    const { years, months } = splitAgeParts(pet.ageRaw)
    setEditPetForm({
      name: pet.name || '',
      breed: pet.breed && pet.breed !== 'Unknown Breed' ? pet.breed : '',
      description: pet.description || '',
      ageYears: years,
      ageMonths: months,
    })
    setEditPetError('')
    setIsEditingPet(true)
  }

  const savePetEdits = async (e) => {
    e.preventDefault()
    if (!selectedPet) return

    const ageYears = Number.parseInt(editPetForm.ageYears, 10) || 0
    const ageMonths = Number.parseInt(editPetForm.ageMonths, 10) || 0

    if (ageYears === 0 && ageMonths === 0) {
      setEditPetError('Please select a valid age (at least 1 month).')
      return
    }

    setSavingPetEdits(true)
    setEditPetError('')

    try {
      const totalMonths = ageYears * 12 + ageMonths
      const encodedAge = AGE_STORAGE_OFFSET + totalMonths

      const payload = {
        name: editPetForm.name.trim(),
        breed: editPetForm.breed.trim() || null,
        age: encodedAge,
        description: editPetForm.description.trim() || null,
      }

      const response = await apiClient.put(`/v1/pets/${selectedPet.id}`, payload)
      const updatedApiPet = response.data
      const updatedUiPet = toUiPet(updatedApiPet)

      setApiPets((prev) => prev.map((pet) => (pet.id === updatedApiPet.id ? updatedApiPet : pet)))
      setSelectedPet(updatedUiPet)
      setIsEditingPet(false)
    } catch (err) {
      setEditPetError(err.response?.data?.detail || 'Failed to update pet details.')
    } finally {
      setSavingPetEdits(false)
    }
  }

  const deletePetFromDetails = async () => {
    if (!selectedPet) return

    const confirmed = globalThis.confirm(`Delete ${selectedPet.name}? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingPet(true)
    setEditPetError('')

    try {
      await apiClient.delete(`/v1/pets/${selectedPet.id}`)
      setApiPets((prev) => prev.filter((pet) => pet.id !== selectedPet.id))
      closePetDetails()
    } catch (err) {
      setEditPetError(err.response?.data?.detail || 'Failed to delete pet.')
      setDeletingPet(false)
    }
  }

  const filteredPets = sourcePets.filter(pet => {
    const typeMatch = selectedFilters.type === 'all' || pet.type === selectedFilters.type
    const ageMatch = selectedFilters.age === 'all' || pet.ageCategory === selectedFilters.age
    const queryMatch = !searchQuery || pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && ageMatch && queryMatch
  })

  const submitAdoptionRequest = async (pet) => {
    if (!pet || !canRequestAdoption) return

    setRequestingPetId(pet.id)
    setRequestMessage('')
    setRequestError('')

    try {
      await apiClient.post('/v1/adoptions/requests', { pet_id: pet.id })
      setRequestMessage(`Adoption request submitted for ${pet.name}.`)
      // Remove from available list immediately in UI.
      setApiPets((prev) => prev.filter((item) => item.id !== pet.id))
      if (selectedPet?.id === pet.id) {
        closePetDetails()
      }
    } catch (err) {
      setRequestError(err.response?.data?.detail || 'Failed to submit adoption request.')
    } finally {
      setRequestingPetId(null)
    }
  }

  const toggleFavorite = async (petId, e) => {
    e.stopPropagation()
    
    if (user?.role !== 'adopter') return

    const isFavorited = favorites.has(petId)
    setFavoriteLoading((prev) => new Set([...prev, petId]))

    if (isFavorited) {
      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(petId)
        return next
      })
    } else {
      setFavorites((prev) => new Set([...prev, petId]))
    }

    try {
      if (isFavorited) {
        await apiClient.delete(`/v1/favorites/${petId}`)
      } else {
        await apiClient.post(`/v1/favorites/${petId}`)
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      if (isFavorited) {
        setFavorites((prev) => new Set([...prev, petId]))
      } else {
        setFavorites((prev) => {
          const next = new Set(prev)
          next.delete(petId)
          return next
        })
      }
    } finally {
      setFavoriteLoading((prev) => {
        const newLoading = new Set(prev)
        newLoading.delete(petId)
        return newLoading
      })
    }
  }

  // --- Pet Image Component ---
  const PetImage = ({ pet, className = '' }) => {
    const imgUrl = getImageUrl(pet.image_url)

    if (imgUrl) {
      return (
        <img
          src={imgUrl}
          alt={pet.name}
          className={`w-full h-full object-cover ${className}`}
          onError={(e) => {
            // Fallback to emoji on image load error
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    }

    return null
  }

  // --- Pet Card (Grid view) ---
  const PetCard = ({ pet }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 
      dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-lg/20 
      transition-all duration-300 transform hover:scale-105">
      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 
        dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
        {getImageUrl(pet.image_url) ? (
          <img
            src={getImageUrl(pet.image_url)}
            alt={pet.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`emoji-fallback absolute inset-0 items-center justify-center ${getImageUrl(pet.image_url) ? 'hidden' : 'flex'}`}
        >
          <span className="text-6xl">{getEmoji(pet.species)}</span>
        </div>
        {user?.role === 'adopter' && (
          <button 
            onClick={(e) => toggleFavorite(pet.id, e)}
            disabled={favoriteLoading.has(pet.id)}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 
              rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm disabled:opacity-50">
            <Heart className={`w-5 h-5 ${favorites.has(pet.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pet.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {pet.breed} • {pet.age}
        </p>
        <button
          onClick={() => setSelectedPet(pet)}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
          font-semibold rounded-lg transition-colors">
          View Details
        </button>
        {canRequestAdoption && (
          <button
            type="button"
            onClick={() => submitAdoptionRequest(pet)}
            disabled={requestingPetId === pet.id}
            className="mt-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
          >
            {requestingPetId === pet.id ? 'Requesting...' : 'Adopt Request'}
          </button>
        )}
      </div>
    </div>
  )

  // --- Pet List Item ---
  const PetListItem = ({ pet }) => (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg 
      border border-gray-200 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-lg/20 
      transition-all">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 
        dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden 
        flex-shrink-0 relative">
        {getImageUrl(pet.image_url) ? (
          <img
            src={getImageUrl(pet.image_url)}
            alt={pet.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`emoji-fallback absolute inset-0 items-center justify-center ${getImageUrl(pet.image_url) ? 'hidden' : 'flex'}`}
        >
          <span className="text-3xl">{getEmoji(pet.species)}</span>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pet.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pet.breed} • {pet.age}
        </p>
      </div>
      <div className="flex gap-2">
        {user?.role === 'adopter' && (
          <button 
            onClick={(e) => toggleFavorite(pet.id, e)}
            disabled={favoriteLoading.has(pet.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50">
            <Heart className={`w-5 h-5 ${favorites.has(pet.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
        <button
          onClick={() => setSelectedPet(pet)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
          font-semibold rounded-lg transition-colors">
          View
        </button>
        {canRequestAdoption && (
          <button
            type="button"
            onClick={() => submitAdoptionRequest(pet)}
            disabled={requestingPetId === pet.id}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
          >
            {requestingPetId === pet.id ? 'Requesting...' : 'Adopt Request'}
          </button>
        )}
      </div>
    </div>
  )

  const PetDetailsModal = ({ pet }) => {
    if (!pet) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pet.name}</h2>
            <button
              onClick={closePetDetails}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden relative">
              {getImageUrl(pet.image_url) ? (
                <img
                  src={getImageUrl(pet.image_url)}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className={`emoji-fallback absolute inset-0 items-center justify-center ${getImageUrl(pet.image_url) ? 'hidden' : 'flex'}`}
              >
                <span className="text-6xl">{getEmoji(pet.species)}</span>
              </div>
            </div>

            {isEditingPet ? (
              <form id="edit-pet-form" onSubmit={savePetEdits} className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <label className="block mb-1 font-semibold">Name</label>
                  <input
                    type="text"
                    required
                    value={editPetForm.name}
                    onChange={(e) => setEditPetForm({ ...editPetForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">Species</label>
                  <input
                    type="text"
                    value={pet.species || '-'}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">Breed</label>
                  <input
                    type="text"
                    value={editPetForm.breed}
                    onChange={(e) => setEditPetForm({ ...editPetForm, breed: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold">Years</label>
                    <select
                      value={editPetForm.ageYears}
                      onChange={(e) => setEditPetForm({ ...editPetForm, ageYears: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">0 years</option>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((year) => (
                        <option key={year} value={String(year)}>{year} year{year === 1 ? '' : 's'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Months</label>
                    <select
                      value={editPetForm.ageMonths}
                      onChange={(e) => setEditPetForm({ ...editPetForm, ageMonths: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 13 }, (_, i) => i).map((month) => (
                        <option key={month} value={String(month)}>{month} month{month === 1 ? '' : 's'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold">Description</label>
                  <textarea
                    rows={3}
                    value={editPetForm.description}
                    onChange={(e) => setEditPetForm({ ...editPetForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {editPetError && (
                  <p className="text-red-600 dark:text-red-400">{editPetError}</p>
                )}
              </form>
            ) : (
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Species:</strong> {pet.species || '-'}</p>
                <p><strong>Breed:</strong> {pet.breed || '-'}</p>
                <p><strong>Age:</strong> {pet.age ?? '-'}</p>
                <p><strong>Status:</strong> {pet.status || 'available'}</p>
                <div className="pt-2">
                  <p className="font-semibold text-gray-900 dark:text-white">Description</p>
                  <p>{pet.description || 'No description available.'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            {isEditingPet ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPet(false)
                    setEditPetError('')
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-pet-form"
                  disabled={savingPetEdits}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {savingPetEdits ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                {editPetError && (
                  <p className="mr-auto self-center text-sm text-red-600 dark:text-red-400">{editPetError}</p>
                )}
                {canManageSelectedPet && (
                  <>
                    <button
                      type="button"
                      onClick={deletePetFromDetails}
                      disabled={deletingPet}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {deletingPet ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingPet(pet)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Edit Details
                    </button>
                  </>
                )}
                <button
                  onClick={closePetDetails}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
                {canRequestAdoption && (
                  <button
                    type="button"
                    onClick={() => submitAdoptionRequest(pet)}
                    disabled={requestingPetId === pet.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {requestingPetId === pet.id ? 'Requesting...' : 'Adopt Request'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- Add Pet Modal ---
  const AddPetModal = () => {
    const [form, setForm] = useState({
      name: '', species: 'dog', breed: '', ageYears: '0', ageMonths: '0', description: '',
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    const handleImageChange = (e) => {
      const file = e.target.files?.[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setError('Image must be under 5MB')
          return
        }
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        setError(null)
      }
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setSubmitting(true)
      setError(null)

      try {
        const ageYears = Number.parseInt(form.ageYears, 10) || 0
        const ageMonths = Number.parseInt(form.ageMonths, 10) || 0

        if (ageYears === 0 && ageMonths === 0) {
          setError('Please select a valid age (at least 1 month).')
          setSubmitting(false)
          return
        }

        const totalMonths = ageYears * 12 + ageMonths
        const encodedAge = AGE_STORAGE_OFFSET + totalMonths

        const formData = new FormData()
        formData.append('name', form.name)
        formData.append('species', form.species)
        if (form.breed) formData.append('breed', form.breed)
        formData.append('age', String(encodedAge))
        if (form.description) formData.append('description', form.description)
        formData.append('status', 'available')
        if (imageFile) formData.append('image', imageFile)

        await uploadFile('/v1/pets/with-image', formData)

        // Refresh pets list and close modal
        await fetchPets()
        setShowAddModal(false)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to add pet. Please try again.')
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Pet</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pet Photo
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-blue-300 dark:border-blue-600">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Click to upload a photo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Buddy"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Species */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Species *
              </label>
              <select
                required
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="fish">Fish</option>
                <option value="hamster">Hamster</option>
                <option value="turtle">Turtle</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Breed + Age row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Breed
                </label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  placeholder="e.g. Golden Retriever"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Years
                </label>
                <select
                  value={form.ageYears}
                  onChange={(e) => setForm({ ...form, ageYears: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">0 years</option>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((year) => (
                    <option key={year} value={String(year)}>{year} year{year === 1 ? '' : 's'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Months
                </label>
                <select
                  value={form.ageMonths}
                  onChange={(e) => setForm({ ...form, ageMonths: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 13 }, (_, i) => i).map((month) => (
                    <option key={month} value={String(month)}>{month} month{month === 1 ? '' : 's'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us about this pet..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding Pet...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Pet
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const FilterSection = ({ label, options, filterKey }) => (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{label}</h3>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={filterKey}
              value={option.id}
              checked={selectedFilters[filterKey] === option.id}
              onChange={() => setSelectedFilters({
                ...selectedFilters,
                [filterKey]: option.id
              })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Browse Pets
        </h1>
        {canAddPets && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Pet
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pets by name or breed..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchQuery(searchQuery.trim())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {(requestMessage || requestError) && (
        <div className="mb-6">
          {requestMessage && (
            <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
              {requestMessage}
            </p>
          )}
          {requestError && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {requestError}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-lg border 
          border-gray-200 dark:border-gray-800 p-6 h-fit sticky top-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
            <button
              onClick={() => {
                setSelectedFilters({ type: 'all', age: 'all' })
                setSearchQuery('')
              }}
              className="text-blue-600 dark:text-blue-400 text-sm font-semibold 
              hover:underline">
              Reset
            </button>
          </div>

          <FilterSection label="Pet Type" options={petTypes} filterKey="type" />
          <FilterSection label="Age" options={ageRanges} filterKey="age" />

          <button
            onClick={() => {}}
            className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 
            text-white font-semibold rounded-lg transition-colors">
            Apply Filters
          </button>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredPets.length} pets
            </p>
            {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading pets...</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pets Display */}
          {filteredPets.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredPets.map(pet => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPets.map(pet => (
                  <PetListItem key={pet.id} pet={pet} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                No pets found matching your filters
              </p>
              <button
                onClick={() => {
                  setSelectedFilters({ type: 'all', age: 'all' })
                  setSearchQuery('')
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Pet Modal */}
      {showAddModal && canAddPets && <AddPetModal />}
      {selectedPet && <PetDetailsModal pet={selectedPet} />}
    </div>
  )
}
