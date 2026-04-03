import React from 'react'
import { timeAgo, getInitials, getAvatarColor, stripHtml, truncateText } from '../utils/forumHelpers'

function TopicHeader({ topic, onEdit, onDelete, canEdit = false, canDelete = false }) {
  if (!topic) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${getAvatarColor(topic.user?.nama)}`}>
          {getInitials(topic.user?.nama)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {topic.judul}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{topic.user?.nama || 'Anonim'}</span>
                <span>•</span>
                <span>{timeAgo(topic.created_at)}</span>
                <span>•</span>
                <span>{topic.views || 0} views</span>
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => onEdit?.(topic)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete?.(topic.id)}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Hapus
                  </button>
                )}
              </div>
            )}
          </div>
          <div
            className="prose dark:prose-invert max-w-none mt-4 text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: topic.pesan || '' }}
          />
        </div>
      </div>
    </div>
  )
}

export default TopicHeader
