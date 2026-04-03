/**
 * Format date to relative time string in Indonesian
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string (e.g., "2 menit lalu")
 */
export function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Baru saja'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`

  return date.toLocaleDateString('id-ID')
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return '?'

  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Avatar color palette
 */
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500'
]

/**
 * Get consistent avatar color based on name hash
 * @param {string} name - Name to hash
 * @returns {string} Tailwind color class
 */
export function getAvatarColor(name) {
  if (!name) return COLORS[0]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return COLORS[Math.abs(hash) % COLORS.length]
}

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return ''

  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text

  return text.slice(0, maxLength) + '...'
}
