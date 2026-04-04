export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage users, pets, and adoption requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">128</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Listed Pets</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">42</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">19</p>
        </div>
      </div>
    </div>
  )
}
