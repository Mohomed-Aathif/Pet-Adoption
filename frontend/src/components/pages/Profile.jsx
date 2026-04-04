import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Profile</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Manage your account information and preferences.</p>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
          <p className="text-gray-900 dark:text-white font-medium">John Adopter</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
          <p className="text-gray-900 dark:text-white font-medium">john@example.com</p>
        </div>
        <div className="pt-2 flex gap-3">
          <button
            onClick={() => navigate('/pets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Browse Pets
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            View Notifications
          </button>
        </div>
      </div>
    </div>
  )
}
