import { useNavigate } from 'react-router-dom'

const notifications = [
  { id: 1, text: 'New pets were added near your location.', time: '2 min ago' },
  { id: 2, text: 'Your adoption request has been reviewed.', time: '1 hour ago' },
  { id: 3, text: 'A shelter sent you a new message.', time: 'Yesterday' },
]

export default function Notifications() {
  const navigate = useNavigate()

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Stay up to date with recent account and adoption activity.</p>

      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-gray-900 dark:text-white">{item.text}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.time}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate('/')}
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
