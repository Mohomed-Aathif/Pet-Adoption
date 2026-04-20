import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import apiClient from '../../services/api'

const CARD_NUMBER_PATTERN = /^\d{16}$/
const CVV_PATTERN = /^\d{3}$/

const formatCardNumber = (value) => {
  const digitsOnly = value.replaceAll(/\D/g, '').slice(0, 16)
  return digitsOnly.replaceAll(/(.{4})/g, '$1 ').trim()
}

const getCardDigits = (value) => value.replaceAll(/\D/g, '')

export default function DonationPayment() {
  const location = useLocation()
  const donationData = location.state?.donationData

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [donationId, setDonationId] = useState(null)

  const amountFormatted = useMemo(() => {
    const amount = Number(donationData?.amount || 0)
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)
  }, [donationData?.amount])

  const yearOptions = useMemo(() => {
    const startYear = 2026
    const endYear = 2031
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  }, [])

  if (!donationData) {
    return <Navigate to="/donate" replace />
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!CARD_NUMBER_PATTERN.test(getCardDigits(cardData.cardNumber))) {
      nextErrors.cardNumber = 'Card number must be exactly 16 digits.'
    }

    if (!cardData.cardHolderName.trim()) {
      nextErrors.cardHolderName = 'Card holder name is required.'
    }

    const month = Number(cardData.expiryMonth)
    const year = Number(cardData.expiryYear)

    if (!month || month < 1 || month > 12) {
      nextErrors.expiryMonth = 'Please select a valid expiry month.'
    }

    if (!year) {
      nextErrors.expiryYear = 'Please select a valid expiry year.'
    }

    if (month && year) {
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        nextErrors.expiryYear = 'Card expiry date cannot be in the past.'
      }
    }

    if (!CVV_PATTERN.test(cardData.cvv)) {
      nextErrors.cvv = 'CVV must be exactly 3 digits.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const updateField = (field, value) => {
    setCardData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setApiError('')

      const payload = {
        name: donationData.name,
        email: donationData.email || null,
        contact_number: donationData.contactNumber || null,
        amount: donationData.amount,
        payment: {
          card_number: getCardDigits(cardData.cardNumber),
          card_holder_name: cardData.cardHolderName.trim(),
          expiry_month: Number(cardData.expiryMonth),
          expiry_year: Number(cardData.expiryYear),
          cvv: cardData.cvv,
        },
      }

      const response = await apiClient.post('/v1/donations/pay', payload)
      setSuccessMessage(response.data?.message || 'Donation successful. A confirmation email has been sent to you.')
      setDonationId(response.data?.donation_id || null)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail) && detail.length > 0) {
        setApiError(detail[0]?.msg || 'Payment failed. Please check your details and try again.')
      } else if (typeof detail === 'string') {
        setApiError(detail)
      } else {
        setApiError('Payment failed. Please check your details and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50 px-4 py-10 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Details</h1>
          <Link to="/donate" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Back
          </Link>
        </div>

        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm text-emerald-900 dark:text-emerald-200">Donation Amount</p>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200">{amountFormatted}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="card-number" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Card Number</label>
            <input
              id="card-number"
              name="donation-card-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              data-lpignore="true"
              maxLength={19}
              value={cardData.cardNumber}
              onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="4252 1525 2365 2589"
            />
            {errors.cardNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cardNumber}</p>}
          </div>

          <div>
            <label htmlFor="card-holder" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Card Holder Name</label>
            <input
              id="card-holder"
              name="donation-card-holder"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              value={cardData.cardHolderName}
              onChange={(e) => updateField('cardHolderName', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              placeholder="Name on card"
            />
            {errors.cardHolderName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cardHolderName}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="expiry-month" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Expiry Month</label>
              <select
                id="expiry-month"
                name="donation-expiry-month"
                autoComplete="off"
                value={cardData.expiryMonth}
                onChange={(e) => updateField('expiryMonth', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              {errors.expiryMonth && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiryMonth}</p>}
            </div>

            <div>
              <label htmlFor="expiry-year" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Expiry Year</label>
              <select
                id="expiry-year"
                name="donation-expiry-year"
                autoComplete="off"
                value={cardData.expiryYear}
                onChange={(e) => updateField('expiryYear', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.expiryYear && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiryYear}</p>}
            </div>

            <div>
              <label htmlFor="cvv" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">CVV</label>
              <input
                id="cvv"
                name="donation-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                data-lpignore="true"
                maxLength={3}
                value={cardData.cvv}
                onChange={(e) => updateField('cvv', e.target.value.replaceAll(/\D/g, ''))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none ring-blue-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                placeholder="123"
              />
              {errors.cvv && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cvv}</p>}
            </div>
          </div>

          {apiError && <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Processing Payment...' : 'Pay Now'}
          </button>
        </form>
      </div>

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-200 bg-white p-7 text-center shadow-2xl dark:border-emerald-900/50 dark:bg-gray-900">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-700/30" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl dark:bg-blue-700/20" />

            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-emerald-400/40" />
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40" />
              <span className="relative text-2xl font-bold text-emerald-700 dark:text-emerald-300">✓</span>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Payment Successful</h2>
            <p className="mb-2 text-gray-700 dark:text-gray-300">{successMessage}</p>
            {donationId && (
              <p className="mb-6 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">Reference ID: #{donationId}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Return to Home
              </Link>
              <Link
                to="/donate"
                className="inline-flex justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Donate Again
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
