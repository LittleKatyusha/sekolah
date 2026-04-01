/**
 * Format date string to long Indonesian format (e.g., "11 Maret 2026")
 * Used in Detail pages
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Format date string to short format (dd/mm/yyyy)
 * Used in List pages
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date string to long Indonesian format with time (e.g., "11 Maret 2026 14:30")
 * Used in Detail pages for timestamps
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string (e.g., "Rp 1.500.000")
 */
export const formatRupiah = (value) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}