import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT_PATTERN = /^[+]?[-() 0-9]{7,20}$/

export default function Donation() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    amount: '',
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required.'
    }

    const amountValue = Number(formData.amount)
    if (!formData.amount || Number.isNaN(amountValue)) {
      nextErrors.amount = 'Amount must be a valid number.'
    } else if (amountValue <= 0) {
      nextErrors.amount = 'Amount must be greater than 0.'
    }

    if (formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (formData.contactNumber.trim() && !CONTACT_PATTERN.test(formData.contactNumber.trim())) {
      nextErrors.contactNumber = 'Please enter a valid contact number.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    navigate('/donate/payment', {
      state: {
        donationData: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          contactNumber: formData.contactNumber.trim(),
          amount: Number(formData.amount),
        },
      },
    })
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50 px-4 py-10 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">General Donation</h1>
          <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Back Home
          </Link>
        </div>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Your support helps us care for rescued pets and find them loving homes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="donor-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              id="donor-name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="Enter your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="donor-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Email (Optional)</label>
            <input
              id="donor-email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="Enter your email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="donor-contact" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Contact Number (Optional)</label>
            <input
              id="donor-contact"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="e.g. +94 77 123 4567"
            />
            {errors.contactNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactNumber}</p>}
          </div>

          <div>
            <label htmlFor="donation-amount" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Amount (LKR)</label>
            <input
              id="donation-amount"
              type="number"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="1000"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Continue to Payment
          </button>
        </form>
      </div>
    </div>
  )
}
