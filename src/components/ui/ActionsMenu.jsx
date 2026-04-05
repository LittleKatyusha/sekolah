import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Edit, Trash2, MoreVertical, BarChart3 } from 'lucide-react'
import usePermission from '../../hooks/usePermission'

const ActionsMenu = ({
  onDetail,
  onEdit,
  onDelete,
  extraActions = [],
  // Permission props for built-in actions
  detailPermission,
  editPermission,
  deletePermission,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const { hasPermission } = usePermission()

  const resolvedExtraActions = Array.isArray(extraActions) ? extraActions : []

  // Filter extra actions based on their optional permission property
  const filteredExtraActions = useMemo(() => {
    return resolvedExtraActions.filter((action) => {
      if (!action.permission) return true
      return hasPermission(action.permission)
    })
  }, [resolvedExtraActions, hasPermission])

  // Check permissions for built-in actions
  const showDetail = onDetail && (detailPermission ? hasPermission(detailPermission) : true)
  const showEdit = onEdit && (editPermission ? hasPermission(editPermission) : true)
  const showDelete = onDelete && (deletePermission ? hasPermission(deletePermission) : true)

  // Determine if menu should render at all
  const hasVisibleActions = showDetail || filteredExtraActions.length > 0 || showEdit || showDelete

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

  const handleButtonClick = (e) => {
    e.stopPropagation()

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192
      })
    }

    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
      const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)

      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      {hasVisibleActions && (
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Actions"
        >
          <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            {showDetail && (
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            )}
            {filteredExtraActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action.onClick)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                {action.icon || <BarChart3 size={16} className="text-indigo-600" />}
                {action.label}
              </button>
            ))}
            {showEdit && (
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            )}
            {showDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ActionsMenu