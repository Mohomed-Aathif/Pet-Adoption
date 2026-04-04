import { Heart, TrendingUp, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const stats = [
    { label: 'Available Pets', value: '324', icon: Heart, color: 'blue' },
    { label: 'Successful Adoptions', value: '1,247', icon: TrendingUp, color: 'green' },
    { label: 'Active Community', value: '5,892', icon: Users, color: 'purple' }
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Find Your Perfect Pet Companion
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
          Connect with loving animals waiting for their forever homes. Browse, 
          favorite, and start your adoption journey today.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-12 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by breed, type, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/pets?search=${encodeURIComponent(query)}`)
            }
          }}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 
            text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => navigate(`/pets?search=${encodeURIComponent(query)}`)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
          font-semibold rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
            green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
            purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
          }

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${colorClasses[stat.color]} rounded-lg p-6 border`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-10 h-10" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${colorClasses[stat.color].split(' ')[0]}`}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Featured Pets Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Featured Pets 🌟
          </h2>
          <Link to="/pets" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '🐕', name: 'Max', breed: 'Golden Retriever', age: '2 years' },
            { emoji: '🐈', name: 'Luna', breed: 'Bengal Cat', age: '1 year' },
            { emoji: '🦜', name: 'Polly', breed: 'African Grey', age: '3 years' }
          ].map((pet, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 
                dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:shadow-lg/20 
                transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400 
                dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <span className="text-6xl">{pet.emoji}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {pet.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {pet.breed} • {pet.age}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/pets')}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                    text-white font-semibold rounded-lg transition-colors">
                    View Details
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 
                    text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 
                    font-semibold rounded-lg transition-colors">
                    ♥
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 
        dark:to-blue-800 rounded-lg p-8 sm:p-12 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Make a Difference?
        </h2>
        <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
          Start your adoption journey today and give a loving pet their forever home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/pets')}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg 
            hover:bg-blue-50 transition-colors">
            Browse Pets
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="px-8 py-3 border-2 border-white text-white font-semibold 
            rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}
