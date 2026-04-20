import { useEffect, useMemo, useState } from 'react'
import apiClient from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AdminDonations() {
  const [donations, setDonations] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  })

  const buildQueryParams = (skipValue, limitValue) => {
    const params = new URLSearchParams()
    params.set('skip', String(skipValue))
    params.set('limit', String(limitValue))

    if (filters.startDate) params.set('start_date', filters.startDate)
    if (filters.endDate) params.set('end_date', filters.endDate)
    if (filters.minAmount) params.set('min_amount', filters.minAmount)
    if (filters.maxAmount) params.set('max_amount', filters.maxAmount)

    return params
  }

  const loadDonations = async (nextPage = page, nextPageSize = pageSize) => {
    try {
      setLoading(true)
      setError('')

      const params = buildQueryParams((nextPage - 1) * nextPageSize, nextPageSize)

      const response = await apiClient.get(`/v1/donations/admin?${params.toString()}`)
      setDonations(Array.isArray(response.data?.items) ? response.data.items : [])
      setTotal(Number(response.data?.total || 0))
      setPage(nextPage)
      setPageSize(nextPageSize)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load donations')
      setDonations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDonations(1, pageSize)
  }, [filters])

  const totalAmount = useMemo(() => {
    return donations.reduce((sum, item) => sum + Number(item?.amount || 0), 0)
  }, [donations])

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount || 0))
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    })
  }

  const handleExportPdf = async () => {
    try {
      setExporting(true)
      setError('')

      const chunkSize = 500
      let skip = 0
      let fetchedTotal = 0
      const allItems = []

      do {
        const params = buildQueryParams(skip, chunkSize)
        const response = await apiClient.get(`/v1/donations/admin?${params.toString()}`)
        const items = Array.isArray(response.data?.items) ? response.data.items : []

        fetchedTotal = Number(response.data?.total || 0)
        allItems.push(...items)
        skip += chunkSize
      } while (allItems.length < fetchedTotal)

      if (allItems.length === 0) {
        setError('No donations found to export for the current filters.')
        return
      }

      const doc = new jsPDF()
      const timestamp = new Date().toLocaleString()
      const rangeLabel = [
        filters.startDate ? `From ${filters.startDate}` : null,
        filters.endDate ? `To ${filters.endDate}` : null,
        filters.minAmount ? `Min ${formatAmount(filters.minAmount)}` : null,
        filters.maxAmount ? `Max ${formatAmount(filters.maxAmount)}` : null,
      ].filter(Boolean).join(' | ') || 'All donations'

      doc.setFontSize(16)
      doc.text('Donation Report', 14, 16)
      doc.setFontSize(10)
      doc.text(`Generated on: ${timestamp}`, 14, 24)
      doc.text(`Filter range: ${rangeLabel}`, 14, 30)
      doc.text(`Total donations: ${allItems.length}`, 14, 36)
      doc.text(`Total amount: ${formatAmount(allItems.reduce((sum, item) => sum + Number(item?.amount || 0), 0))}`, 14, 42)

      autoTable(doc, {
        startY: 48,
        head: [['Donor Name', 'Email', 'Contact Number', 'Amount', 'Date', 'Time']],
        body: allItems.map((item) => [
          item.name || '-',
          item.email || '-',
          item.contact_number || '-',
          formatAmount(item.amount),
          item.donation_date || '-',
          item.donation_time || '-',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] },
      })

      const fileStamp = new Date().toISOString().slice(0, 10)
      doc.save(`donations-report-${fileStamp}.pdf`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to export donations PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donations</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={loading || exporting}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
          <button
            type="button"
            onClick={() => loadDonations(page, pageSize)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">From Date</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">To Date</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Min Amount (LKR)</span>
            <input
              type="number"
              min="1"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Max Amount (LKR)</span>
            <input
              type="number"
              min="1"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-600 dark:text-gray-300">Loading donations...</p>}
        {!loading && error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span>Total matching donations: {total}</span>
              <span>Current page records: {donations.length}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                {formatAmount(totalAmount)}
              </span>
            </div>

            {donations.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No donations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      <th className="py-2 pr-4">Donor Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 text-gray-800 dark:border-gray-800 dark:text-gray-100">
                        <td className="py-2 pr-4">{item.name}</td>
                        <td className="py-2 pr-4">{item.email || '-'}</td>
                        <td className="py-2 pr-4 font-semibold">{formatAmount(item.amount)}</td>
                        <td className="py-2 pr-4">{item.donation_date}</td>
                        <td className="py-2 pr-4">{item.donation_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-gray-600 dark:text-gray-300">Rows:</label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => loadDonations(1, Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => loadDonations(page - 1, pageSize)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadDonations(page + 1, pageSize)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
