import { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { Sun, Moon, Save, LogOut } from 'lucide-react'

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State',
    bio: 'Pet lover and adoption advocate',
    notifications: {
      email: true,
      sms: false,
      newPets: true,
      adoptionUpdates: true,
      newsletter: false
    },
    preferences: {
      theme: isDark ? 'dark' : 'light',
      language: 'en'
    }
  })

  const [saved, setSaved] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNotificationChange = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const SettingSection = ({ title, children }) => (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      {children}
    </div>
  )

  const FormInput = ({ label, name, type = 'text', ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
          border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      />
    </div>
  )

  const CheckboxInput = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer mb-3 p-3 rounded-lg 
      hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 rounded"
      />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  )

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        Settings
      </h1>

      {/* Success Message */}
      {saved && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 
          dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          ✓ Settings saved successfully!
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 
        dark:border-gray-800 p-6 sm:p-8">

        {/* Profile Settings */}
        <SettingSection title="Profile Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="First Name" name="firstName" />
            <FormInput label="Last Name" name="lastName" />
          </div>
          <FormInput label="Email" name="email" type="email" />
          <FormInput label="Phone" name="phone" type="tel" />
          <FormInput label="Address" name="address" />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>
        </SettingSection>

        {/* Notification Preferences */}
        <SettingSection title="Notification Preferences">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Communication Channels
            </h3>
            <CheckboxInput
              label="Email Notifications"
              checked={formData.notifications.email}
              onChange={() => handleNotificationChange('email')}
            />
            <CheckboxInput
              label="SMS Notifications"
              checked={formData.notifications.sms}
              onChange={() => handleNotificationChange('sms')}
            />

            <hr className="my-4 border-gray-200 dark:border-gray-700" />

            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Notification Types
            </h3>
            <CheckboxInput
              label="New Pet Listings (Your preferred types)"
              checked={formData.notifications.newPets}
              onChange={() => handleNotificationChange('newPets')}
            />
            <CheckboxInput
              label="Adoption Application Updates"
              checked={formData.notifications.adoptionUpdates}
              onChange={() => handleNotificationChange('adoptionUpdates')}
            />
            <CheckboxInput
              label="Newsletter & Tips"
              checked={formData.notifications.newsletter}
              onChange={() => handleNotificationChange('newsletter')}
            />
          </div>
        </SettingSection>

        {/* Appearance Settings */}
        <SettingSection title="Appearance">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (isDark) toggleTheme()
                    setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: 'light' }
                    }))
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 
                    transition-colors ${
                    !isDark
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  Light
                </button>
                <button
                  onClick={() => {
                    if (!isDark) toggleTheme()
                    setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: 'dark' }
                    }))
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 
                    transition-colors ${
                    isDark
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  Dark
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 
                dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                id="language"
                value={formData.preferences.language}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: e.target.value }
                }))}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                  border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* Account Settings */}
        <SettingSection title="Account">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Keep your account secure with a strong password.
              </p>
              <button className="px-4 py-2 text-blue-600 dark:text-blue-400 font-semibold 
                hover:underline">
                Change Password
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Permanently delete your account and all associated data.
              </p>
              <button className="px-4 py-2 text-red-600 dark:text-red-400 font-semibold 
                hover:underline">
                Delete Account
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-8 
          flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 
              hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-2 
            bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold 
            rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
