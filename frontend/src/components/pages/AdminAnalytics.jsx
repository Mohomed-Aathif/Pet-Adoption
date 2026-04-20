import { useEffect, useMemo, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import 'chart.js/auto'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import apiClient from '../../services/api'
import { useTheme } from '../../hooks/useTheme'

const formatCurrency = (value) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(value || 0))

const pad = (value) => String(value).padStart(2, '0')

const toTimestamp = (value) => {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

const startOfWeek = (value) => {
  const date = new Date(value)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + offset)
  date.setHours(0, 0, 0, 0)
  return date
}

const endOfDay = (value) => {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

const getBucketMeta = (value, granularity) => {
  const date = new Date(value)

  if (granularity === 'weekly') {
    const weekStart = startOfWeek(date)
    return {
      key: `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`,
      label: `Week of ${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
      cursor: weekStart,
    }
  }

  if (granularity === 'monthly') {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    return {
      key: `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}`,
      label: monthStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      cursor: monthStart,
    }
  }

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return {
    key: `${dayStart.getFullYear()}-${pad(dayStart.getMonth() + 1)}-${pad(dayStart.getDate())}`,
    label: dayStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    cursor: dayStart,
  }
}

const buildTimeline = (records, getDateValue, granularity) => {
  const timestamps = records
    .map((item) => toTimestamp(getDateValue(item)))
    .filter((value) => value !== null)

  if (timestamps.length === 0) {
    return []
  }

  const minDate = new Date(Math.min(...timestamps))
  const maxDate = new Date(Math.max(...timestamps))
  const buckets = []

  if (granularity === 'weekly') {
    let cursor = startOfWeek(minDate)
    const maxCursor = startOfWeek(maxDate)

    while (cursor <= maxCursor) {
      buckets.push(getBucketMeta(cursor, 'weekly'))
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    return buckets
  }

  if (granularity === 'monthly') {
    let cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    const maxCursor = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

    while (cursor <= maxCursor) {
      buckets.push(getBucketMeta(cursor, 'monthly'))
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }

    return buckets
  }

  let cursor = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
  const maxCursor = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())

  while (cursor <= maxCursor) {
    buckets.push(getBucketMeta(cursor, 'daily'))
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }

  return buckets
}

const groupSeries = (records, getDateValue, granularity, valueGetter) => {
  const timeline = buildTimeline(records, getDateValue, granularity)
  const valueMap = new Map()

  for (const item of records) {
    const dateValue = getDateValue(item)
    const timestamp = toTimestamp(dateValue)
    if (timestamp === null) continue

    const meta = getBucketMeta(timestamp, granularity)
    valueMap.set(meta.key, (valueMap.get(meta.key) || 0) + Number(valueGetter(item) || 0))
  }

  return timeline.map((bucket) => ({
    label: bucket.label,
    value: valueMap.get(bucket.key) || 0,
  }))
}

const getRequestDateValue = (item) => item?.adoption_date || item?.created_at || null

const getDonationDateValue = (item) => {
  if (item?.donation_date) {
    return `${item.donation_date}T${item.donation_time || '00:00:00'}`
  }
  return item?.created_at || null
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatRangeLabel = (startDate, endDate) => {
  if (startDate && endDate) return `${startDate} to ${endDate}`
  if (startDate) return `From ${startDate}`
  if (endDate) return `Until ${endDate}`
  return 'All dates'
}

const getWeekdayName = (value) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-GB', { weekday: 'long' })
}

export default function AdminAnalytics() {
  const { isDark } = useTheme()
  const [summary, setSummary] = useState(null)
  const [requests, setRequests] = useState([])
  const [donations, setDonations] = useState([])
  const [donationSummary, setDonationSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [granularity, setGranularity] = useState('monthly')
  const [generatingReport, setGeneratingReport] = useState(false)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const [summaryResponse, requestsResponse, donationSummaryResponse, donationListResponse] = await Promise.all([
        apiClient.get('/v1/dashboard/summary'),
        apiClient.get('/v1/adoptions/requests?skip=0&limit=500'),
        apiClient.get('/v1/donations/admin/summary'),
        apiClient.get('/v1/donations/admin?skip=0&limit=500'),
      ])

      setSummary(summaryResponse.data)
      setRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : [])
      setDonationSummary(donationSummaryResponse.data || null)
      setDonations(Array.isArray(donationListResponse.data?.items) ? donationListResponse.data.items : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics')
      setSummary(null)
      setRequests([])
      setDonationSummary(null)
      setDonations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const rangeBounds = useMemo(() => {
    return {
      start: startDate ? new Date(`${startDate}T00:00:00`).getTime() : null,
      end: endDate ? endOfDay(`${endDate}T00:00:00`).getTime() : null,
    }
  }, [startDate, endDate])

  const withinRange = (timestamp) => {
    if (timestamp === null) return false
    if (rangeBounds.start !== null && timestamp < rangeBounds.start) return false
    if (rangeBounds.end !== null && timestamp > rangeBounds.end) return false
    return true
  }

  const completedAdoptions = useMemo(() => {
    return requests.filter((item) => String(item?.status || '').toLowerCase() === 'completed')
  }, [requests])

  const selectedRequests = useMemo(() => {
    return requests.filter((item) => withinRange(toTimestamp(getRequestDateValue(item))))
  }, [requests, rangeBounds.start, rangeBounds.end])

  const selectedCompletedAdoptions = useMemo(() => {
    return selectedRequests.filter((item) => String(item?.status || '').toLowerCase() === 'completed')
  }, [selectedRequests])

  const selectedDonations = useMemo(() => {
    return donations.filter((item) => withinRange(toTimestamp(getDonationDateValue(item))))
  }, [donations, rangeBounds.start, rangeBounds.end])

  const requestSuccessRate = selectedRequests.length > 0
    ? Math.round((selectedCompletedAdoptions.length / selectedRequests.length) * 100)
    : 0

  const adoptionTrendSeries = useMemo(() => {
    return groupSeries(
      selectedCompletedAdoptions,
      getRequestDateValue,
      granularity,
      () => 1
    )
  }, [granularity, selectedCompletedAdoptions])

  const donationTrendSeries = useMemo(() => {
    return groupSeries(
      selectedDonations,
      getDonationDateValue,
      granularity,
      (item) => Number(item?.amount || 0)
    )
  }, [granularity, selectedDonations])

  const funnelData = useMemo(() => {
    const approvedCount = selectedRequests.filter((item) => String(item?.status || '').toLowerCase() !== 'cancelled').length

    return {
      labels: ['Requests', 'Approved', 'Completed Adoptions'],
      values: [selectedRequests.length, approvedCount, selectedCompletedAdoptions.length],
    }
  }, [selectedCompletedAdoptions.length, selectedRequests])

  const chartTextColor = isDark ? 'rgba(229, 231, 235, 0.95)' : 'rgba(55, 65, 81, 0.95)'
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.22)'
  const tooltipBg = isDark ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.98)'
  const tooltipBorder = isDark ? 'rgba(75, 85, 99, 0.45)' : 'rgba(203, 213, 225, 0.95)'

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: chartTextColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: chartTextColor,
        bodyColor: chartTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor },
        grid: { color: gridColor },
      },
      y: {
        beginAtZero: true,
        ticks: { color: chartTextColor, precision: 0 },
        grid: { color: gridColor },
      },
    },
  }), [chartTextColor, gridColor, tooltipBg, tooltipBorder])

  const donationChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: chartTextColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: chartTextColor,
        bodyColor: chartTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor },
        grid: { color: gridColor },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: chartTextColor,
          callback: (value) => formatCurrency(value),
        },
        grid: { color: gridColor },
      },
    },
  }), [chartTextColor, gridColor, tooltipBg, tooltipBorder])

  const funnelChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: chartTextColor,
        bodyColor: chartTextColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: chartTextColor, precision: 0 },
        grid: { color: gridColor },
      },
      y: {
        ticks: { color: chartTextColor },
        grid: { color: gridColor },
      },
    },
  }), [chartTextColor, gridColor, tooltipBg, tooltipBorder])

  const adoptionTrendData = useMemo(() => ({
    labels: adoptionTrendSeries.map((item) => item.label),
    datasets: [
      {
        label: 'Completed adoptions',
        data: adoptionTrendSeries.map((item) => item.value),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(196, 181, 253, 0.24)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }), [adoptionTrendSeries])

  const donationTrendData = useMemo(() => ({
    labels: donationTrendSeries.map((item) => item.label),
    datasets: [
      {
        label: 'Donation amount',
        data: donationTrendSeries.map((item) => item.value),
        borderRadius: 10,
        backgroundColor: 'rgba(167, 139, 250, 0.82)',
        hoverBackgroundColor: 'rgba(124, 58, 237, 0.92)',
      },
    ],
  }), [donationTrendSeries])

  const funnelChartData = useMemo(() => ({
    labels: funnelData.labels,
    datasets: [
      {
        label: 'Conversion flow',
        data: funnelData.values,
        backgroundColor: ['rgba(196, 181, 253, 0.82)', 'rgba(167, 139, 250, 0.82)', 'rgba(124, 58, 237, 0.82)'],
        borderRadius: 12,
        barThickness: 22,
      },
    ],
  }), [funnelData.labels, funnelData.values])

  const donationLast30Days = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recent = donations.filter((item) => {
      const timestamp = toTimestamp(getDonationDateValue(item))
      return timestamp !== null && timestamp >= since
    })

    return {
      count: recent.length,
      amount: recent.reduce((total, item) => total + Number(item?.amount || 0), 0),
    }
  }, [donations])

  const topPetType = summary?.platform_statistics?.most_adopted_pet_types?.[0] || null

  const highestDonationThisMonth = useMemo(() => {
    const current = new Date()
    const monthKey = `${current.getFullYear()}-${pad(current.getMonth() + 1)}`
    const thisMonth = donations.filter((item) => {
      const timestamp = toTimestamp(getDonationDateValue(item))
      if (timestamp === null) return false
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}` === monthKey
    })

    if (thisMonth.length === 0) return null

    return thisMonth.reduce((best, item) => {
      if (!best) return item
      return Number(item?.amount || 0) > Number(best?.amount || 0) ? item : best
    }, null)
  }, [donations])

  const peakAdoptionDay = useMemo(() => {
    if (selectedCompletedAdoptions.length === 0) return null

    const counts = new Map()
    for (const item of selectedCompletedAdoptions) {
      const timestamp = toTimestamp(getRequestDateValue(item))
      if (timestamp === null) continue
      const day = getWeekdayName(timestamp)
      counts.set(day, (counts.get(day) || 0) + 1)
    }

    let peak = null
    for (const [day, count] of counts.entries()) {
      if (!peak || count > peak.count) {
        peak = { day, count }
      }
    }

    return peak
  }, [selectedCompletedAdoptions])

  const filteredRows = useMemo(() => {
    return [...selectedCompletedAdoptions].sort((left, right) => {
      const leftTimestamp = toTimestamp(getRequestDateValue(left)) || 0
      const rightTimestamp = toTimestamp(getRequestDateValue(right)) || 0
      return rightTimestamp - leftTimestamp
    })
  }, [selectedCompletedAdoptions])

  const generatePdfReport = () => {
    setGeneratingReport(true)

    try {
      const doc = new jsPDF()
      const generatedOn = new Date().toLocaleString()
      const rangeLabel = formatRangeLabel(startDate, endDate)
      const adoptionSuccess = selectedRequests.length > 0
        ? Math.round((selectedCompletedAdoptions.length / selectedRequests.length) * 100)
        : 0

      doc.setFontSize(18)
      doc.text('Admin Analytics Report', 14, 16)
      doc.setFontSize(10)
      doc.text(`Generated on: ${generatedOn}`, 14, 24)
      doc.text(`Date range: ${rangeLabel}`, 14, 30)

      autoTable(doc, {
        startY: 38,
        head: [['Metric', 'Value']],
        body: [
          ['Total Pet Adoptions', String(selectedCompletedAdoptions.length)],
          ['Total Requests', String(selectedRequests.length)],
          ['Adoption Success Rate', `${adoptionSuccess}%`],
          ['Total Donations', formatCurrency(selectedDonations.length)],
          ['Donation Amount', formatCurrency(selectedDonations.reduce((total, item) => total + Number(item?.amount || 0), 0))],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      })

      const metricsEndY = doc.lastAutoTable?.finalY || 38
      autoTable(doc, {
        startY: metricsEndY + 8,
        head: [['Request ID', 'Pet Name', 'Pet Owner', 'Adopter', 'Adoption Date']],
        body: filteredRows.map((item) => [
          item.id,
          item.pet_name || '-',
          item.pet_owner_name || '-',
          item.user_name || '-',
          formatDisplayDate(getRequestDateValue(item)),
        ]),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [124, 58, 237] },
      })

      const fileStamp = new Date().toISOString().slice(0, 10)
      doc.save(`admin-analytics-${fileStamp}.pdf`)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleResetRange = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Reporting</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Visual reports for adoption trends, fundraising performance, and request conversion. This page focuses on insight, not operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadAnalytics}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh data
          </button>
          <button
            type="button"
            onClick={generatePdfReport}
            disabled={generatingReport || loading}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {generatingReport ? 'Generating PDF...' : 'Export as PDF'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {loading && <p className="text-gray-700 dark:text-gray-300">Loading analytics...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && summary && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Pet Adoptions</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{selectedCompletedAdoptions.length}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatRangeLabel(startDate, endDate)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Requests</p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-300">{selectedRequests.length}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requests created in the selected range</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Adoption Success Rate</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">{requestSuccessRate}%</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Completed vs total requests</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Donations</p>
                <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-300">{formatCurrency(selectedDonations.reduce((total, item) => total + Number(item?.amount || 0), 0))}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Filtered donation value</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Adoption Trends</p>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Completed adoptions over time</h2>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                    {granularity}
                  </div>
                </div>
                <div className="h-80">
                  {adoptionTrendData.labels.length > 0 ? (
                    <Line data={adoptionTrendData} options={lineChartOptions} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No adoption data available for the selected range.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Donation Trends</p>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donation amount over time</h2>
                  </div>
                  <div className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                    LKR
                  </div>
                </div>
                <div className="h-80">
                  {donationTrendData.labels.length > 0 ? (
                    <Bar data={donationTrendData} options={donationChartOptions} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No donation data available for the selected range.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 xl:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Request Conversion Funnel</p>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Requests to completed adoptions</h2>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Approved means not cancelled</span>
                </div>
                <div className="h-72">
                  {funnelData.values.some((value) => value > 0) ? (
                    <Bar data={funnelChartData} options={funnelChartOptions} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No request records available for the selected range.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date Range Filter</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Focus the report window</h2>
                <div className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">From date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">To date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Trend granularity</span>
                    <select
                      value={granularity}
                      onChange={(event) => setGranularity(event.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleResetRange}
                      className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      Clear range
                    </button>
                    <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {formatRangeLabel(startDate, endDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Donation Summary</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Fundraising snapshot</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/20">
                    <p className="text-xs uppercase tracking-wide text-purple-700 dark:text-purple-200">Total donations</p>
                    <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-200">{donationSummary?.total_donations ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/20">
                    <p className="text-xs uppercase tracking-wide text-purple-700 dark:text-purple-200">Total amount</p>
                    <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-200">{formatCurrency(donationSummary?.total_amount ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200">Donations in last 30 days</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-200">{donationLast30Days.count}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200">Amount in last 30 days</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-200">{formatCurrency(donationLast30Days.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Top Insights</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Highlights worth noting</h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Most adopted pet type</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      {topPetType ? `${topPetType.species} (${topPetType.count})` : 'No adoption data yet'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Highest donation this month</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      {highestDonationThisMonth
                        ? `${highestDonationThisMonth.name || highestDonationThisMonth.email || 'Anonymous'} - ${formatCurrency(highestDonationThisMonth.amount)}`
                        : 'No donations this month'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Peak adoption day</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      {peakAdoptionDay ? `${peakAdoptionDay.day} (${peakAdoptionDay.count})` : 'No adoption data in range'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Filtered Data Table</p>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Completed adoptions in the selected range</h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredRows.length} record{filteredRows.length === 1 ? '' : 's'}
                </p>
              </div>

              {filteredRows.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No completed adoption records found for the selected date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300">
                        <th className="py-2 pr-4">Request ID</th>
                        <th className="py-2 pr-4">Pet Name</th>
                        <th className="py-2 pr-4">Pet Owner</th>
                        <th className="py-2 pr-4">Adopter</th>
                        <th className="py-2 pr-4">Adoption Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 text-gray-800 dark:border-gray-800 dark:text-gray-100">
                          <td className="py-2 pr-4">{item.id}</td>
                          <td className="py-2 pr-4">{item.pet_name || '-'}</td>
                          <td className="py-2 pr-4">{item.pet_owner_name || '-'}</td>
                          <td className="py-2 pr-4">{item.user_name || '-'}</td>
                          <td className="py-2 pr-4">{formatDisplayDate(getRequestDateValue(item))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
