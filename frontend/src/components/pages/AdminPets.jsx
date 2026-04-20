import { useEffect, useState } from 'react'
import apiClient from '../../services/api'

const AGE_STORAGE_OFFSET = 10000

const formatPetAge = (rawAge) => {
  if (rawAge === null || rawAge === undefined || rawAge === '') return '-'

  const numericAge = Number(rawAge)
  if (!Number.isFinite(numericAge)) return '-'

  const totalMonths = numericAge >= AGE_STORAGE_OFFSET ? numericAge - AGE_STORAGE_OFFSET : numericAge * 12
  if (totalMonths <= 0) return '-'

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`
  }

  if (months === 0) {
    return `${years} year${years === 1 ? '' : 's'}`
  }

  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`
}

export default function AdminPets() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingPetId, setDeletingPetId] = useState(null)

  const loadPets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get('/v1/pets?skip=0&limit=100')
      setPets(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load pets')
      setPets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPets()
  }, [])

  const handleDeletePet = async (pet) => {
    const confirmed = globalThis.confirm(`Delete pet ${pet.name}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setDeletingPetId(pet.id)
      setError('')
      await apiClient.delete(`/v1/pets/${pet.id}`)
      setPets((prev) => prev.filter((item) => item.id !== pet.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete pet')
    } finally {
      setDeletingPetId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pets</h1>
        <button
          type="button"
          onClick={loadPets}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading pets...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && pets.length === 0 && (
          <p className="text-gray-700 dark:text-gray-300">No pets found.</p>
        )}

        {!loading && !error && pets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">Species</th>
                  <th className="py-2 pr-4">Breed</th>
                  <th className="py-2 pr-4">Age</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id} className="border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100">
                    <td className="py-2 pr-4">{pet.id}</td>
                    <td className="py-2 pr-4">{pet.name}</td>
                    <td className="py-2 pr-4">{pet.owner_name || (pet.owner_id ? `Owner #${pet.owner_id}` : '-')}</td>
                    <td className="py-2 pr-4">{pet.species}</td>
                    <td className="py-2 pr-4">{pet.breed || '-'}</td>
                    <td className="py-2 pr-4">{formatPetAge(pet.age)}</td>
                    <td className="py-2 pr-4">{pet.status}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => handleDeletePet(pet)}
                        disabled={deletingPetId === pet.id}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingPetId === pet.id ? 'Deleting...' : 'Delete'}
                      </button>
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
