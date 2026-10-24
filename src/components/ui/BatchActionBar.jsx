import Button from './Button'
import { Trash2, Download, X } from 'lucide-react'

export default function BatchActionBar({
  selectedCount = 0,
  itemLabel = 'data',
  onDelete,
  onExport,
  onClear,
  deleteLoading = false,
  canDelete = true,
  extraActions,
}) {
  if (selectedCount <= 0) return null

  return (
    <div
      role="toolbar"
      aria-label="Batch Actions Toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-200 max-w-[95vw] overflow-x-auto"
    >
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="inline-flex items-center justify-center bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-semibold px-2.5 py-0.5 rounded-full text-xs">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {itemLabel} terpilih
        </span>
      </div>
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {onDelete && canDelete && (
          <Button
            size="sm"
            variant="danger"
            onClick={onDelete}
            disabled={deleteLoading}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <Trash2 size={15} />
            Hapus Terpilih
          </Button>
        )}
        {onExport && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download size={15} />
            Export Excel Terpilih
          </Button>
        )}
        {extraActions}
        {onClear && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onClear}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <X size={15} />
            Batal
          </Button>
        )}
      </div>
    </div>
  )
}
