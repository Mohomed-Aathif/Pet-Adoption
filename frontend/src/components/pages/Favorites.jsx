import { useEffect, useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import apiClient, { SERVER_URL } from '../../services/api'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const getEmoji = (species) => {
    const speciesEmojis = {
      dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐰', fish: '🐟',
      hamster: '🐹', turtle: '🐢', snake: '🐍',
    }
    if (!species) return '🐾'
    return speciesEmojis[species.toLowerCase()] || '🐾'
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http')) return imageUrl
    return `${SERVER_URL}${imageUrl}`
  }

  const loadFavorites = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/v1/favorites')
      setFavorites(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load favorites')
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const removeFavorite = async (petId) => {
    try {
      await apiClient.delete(`/v1/favorites/${petId}`)
      setFavorites((prev) => prev.filter((pet) => pet.id !== petId))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove favorite')
    }
  }

  let content

  if (isLoading) {
    content = (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading favorites...</p>
      </div>
    )
  } else if (favorites.length === 0) {
    content = (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Heart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Favorites Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start favoriting pets from the Browse section to see them here!
        </p>
      </div>
    )
  } else {
    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((pet) => (
          <div
            key={pet.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-lg/20 transition-all"
          >
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
              {getImageUrl(pet.image_url) ? (
                <img
                  src={getImageUrl(pet.image_url)}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const fallback = e.target.parentElement?.querySelector('.emoji-fallback')
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className={`emoji-fallback absolute inset-0 items-center justify-center ${getImageUrl(pet.image_url) ? 'hidden' : 'flex'}`}>
                <span className="text-6xl">{getEmoji(pet.species)}</span>
              </div>
              <div className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-sm">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {pet.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {pet.breed || 'Unknown Breed'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {pet.description || 'No description available'}
              </p>
              <button
                onClick={() => removeFavorite(pet.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Favorites</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Pets you&apos;ve marked as your favorites
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {content}
    </div>
  )
}
