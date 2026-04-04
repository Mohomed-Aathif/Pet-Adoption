import { useEffect, useMemo, useState } from 'react'
import { Heart, Filter, Grid, List, Plus, X, Upload, Image } from 'lucide-react'
import apiClient, { uploadFile, SERVER_URL } from '../../services/api'
import { useSearchParams } from 'react-router-dom'

export default function PetsBrowse() {
  const [searchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [apiPets, setApiPets] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    age: 'all',
    size: 'all'
  })

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
    { id: 'young', label: 'Young (6-2 years)' },
    { id: 'adult', label: 'Adult (2-7 years)' },
    { id: 'senior', label: 'Senior (7+ years)' }
  ]

  const sizes = [
    { id: 'all', label: 'All Sizes' },
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' }
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
      } catch {
        if (isMounted) setApiPets([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [])

  const sourcePets = useMemo(() => {
    return apiPets.map((pet) => ({
      id: pet.id,
      name: pet.name || 'Pet',
      type: pet.species === 'cat' ? 'cats' : pet.species === 'bird' ? 'birds' : pet.species === 'rabbit' ? 'rabbits' : 'dogs',
      age: pet.age || 'young',
      size: pet.size || 'medium',
      breed: pet.breed || 'Unknown Breed',
      species: pet.species,
      image_url: pet.image_url,
    }))
  }, [apiPets])

  const filteredPets = sourcePets.filter(pet => {
    const typeMatch = selectedFilters.type === 'all' || pet.type === selectedFilters.type
    const ageMatch = selectedFilters.age === 'all' || pet.age === selectedFilters.age
    const sizeMatch = selectedFilters.size === 'all' || pet.size === selectedFilters.size
    const queryMatch = !searchQuery || pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && ageMatch && sizeMatch && queryMatch
  })

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
        <button className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 
          rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
          <Heart className="w-5 h-5 text-red-500" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pet.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {pet.breed} • {pet.age}
        </p>
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
          font-semibold rounded-lg transition-colors">
          View Details
        </button>
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
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <Heart className="w-5 h-5 text-gray-400" />
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
          font-semibold rounded-lg transition-colors">
          View
        </button>
      </div>
    </div>
  )

  // --- Add Pet Modal ---
  const AddPetModal = () => {
    const [form, setForm] = useState({
      name: '', species: 'dog', breed: '', age: '', description: '',
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
        const formData = new FormData()
        formData.append('name', form.name)
        formData.append('species', form.species)
        if (form.breed) formData.append('breed', form.breed)
        if (form.age) formData.append('age', parseInt(form.age))
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
            <div className="grid grid-cols-2 gap-4">
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
                  Age (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="e.g. 3"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Pet
        </button>
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
                setSelectedFilters({ type: 'all', age: 'all', size: 'all' })
                setSearchQuery('')
              }}
              className="text-blue-600 dark:text-blue-400 text-sm font-semibold 
              hover:underline">
              Reset
            </button>
          </div>

          <FilterSection label="Pet Type" options={petTypes} filterKey="type" />
          <FilterSection label="Age" options={ageRanges} filterKey="age" />
          <FilterSection label="Size" options={sizes} filterKey="size" />

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
                  setSelectedFilters({ type: 'all', age: 'all', size: 'all' })
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
      {showAddModal && <AddPetModal />}
    </div>
  )
}
