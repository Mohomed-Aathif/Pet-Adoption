import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../services/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT_PATTERN = /^[+]?[-() 0-9]{7,20}$/

export default function ReportStray() {
  const [formData, setFormData] = useState({
    reporterName: '',
    contactNumber: '',
    location: '',
    email: '',
    description: '',
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.reporterName.trim()) {
      nextErrors.reporterName = 'Reporter name is required.'
    }

    if (!formData.contactNumber.trim()) {
      nextErrors.contactNumber = 'Contact number is required.'
    } else if (!CONTACT_PATTERN.test(formData.contactNumber.trim())) {
      nextErrors.contactNumber = 'Please enter a valid contact number.'
    }

    if (!formData.location.trim()) {
      nextErrors.location = 'Location is required.'
    }

    if (formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setSubmitting(true)
      setApiError('')
      setSuccessMessage('')

      const payload = new FormData()
      payload.append('reporter_name', formData.reporterName.trim())
      payload.append('contact_number', formData.contactNumber.trim())
      payload.append('location', formData.location.trim())

      if (formData.email.trim()) payload.append('email', formData.email.trim())
      if (formData.description.trim()) payload.append('description', formData.description.trim())
      if (formData.image) payload.append('image', formData.image)

      const response = await apiClient.post('/v1/stray-reports', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSuccessMessage(response.data?.message || 'Stray reported successfully. Thank you for helping!')
      setFormData({
        reporterName: '',
        contactNumber: '',
        location: '',
        email: '',
        description: '',
        image: null,
      })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail[0]?.msg || 'Failed to submit stray report.')
      } else {
        setApiError(detail || 'Failed to submit stray report.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50 px-4 py-10 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report a Stray</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Help rescue teams act faster by sharing accurate details.</p>
          </div>
          <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Back Home
          </Link>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
            {successMessage}
          </div>
        )}

        {apiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reporter-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Reporter Name *</label>
            <input
              id="reporter-name"
              type="text"
              value={formData.reporterName}
              onChange={(e) => setField('reporterName', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="Your name"
            />
            {errors.reporterName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reporterName}</p>}
          </div>

          <div>
            <label htmlFor="contact-number" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Contact Number *</label>
            <input
              id="contact-number"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setField('contactNumber', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="e.g. +94 77 123 4567"
            />
            {errors.contactNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactNumber}</p>}
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Location *</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setField('location', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="Street / area / landmark"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setField('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="your@email.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Description (Optional)</label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="E.g. injured dog near bus stand, small kitten under shop awning..."
            />
          </div>

          <div>
            <label htmlFor="stray-image" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Image Upload (Optional)</label>
            <input
              id="stray-image"
              type="file"
              accept="image/*"
              onChange={(e) => setField('image', e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-violet-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Submitting...' : 'Submit Stray Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
