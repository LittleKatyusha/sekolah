import { memo } from 'react'

const ACTION_CONFIG = {
  create: { label: 'Create', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  update: { label: 'Update', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  delete: { label: 'Delete', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  login: { label: 'Login', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  logout: { label: 'Logout', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

const DEFAULT_CONFIG = { className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }

const ActionBadge = memo(({ action, size = 'sm' }) => {
  const key = action?.toLowerCase()
  const c = ACTION_CONFIG[key] || { ...DEFAULT_CONFIG, label: action || '-' }
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
  return <span className={`rounded-full font-medium ${sizeClass} ${c.className}`}>{c.label}</span>
})

ActionBadge.displayName = 'ActionBadge'

export default ActionBadge