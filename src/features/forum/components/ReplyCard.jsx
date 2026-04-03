import React, { memo } from 'react'
import { timeAgo, getInitials, getAvatarColor } from '../utils/forumHelpers'

const ReplyCard = memo(function ReplyCard({ reply, onEdit, onDelete, canEdit = false, canDelete = false }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(reply.user?.nama)}`}>
          {getInitials(reply.user?.nama)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {reply.user?.nama || 'Anonim'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo(reply.created_at)}
              </span>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => onEdit?.(reply)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete?.(reply.id)}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>
          <div
            className="prose dark:prose-invert max-w-none mt-2 text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: reply.pesan || '' }}
          />
        </div>
      </div>
    </div>
  )
})

export default ReplyCard
