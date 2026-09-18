import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Eye, User, Image as ImageIcon } from 'lucide-react'

export const BlogCard = ({ artikel, schoolQuery = '' }) => {
  const detailUrl = `/blog/${artikel.slug}${schoolQuery ? `?${schoolQuery}` : ''}`
  
  const formattedDate = artikel.published_at
    ? new Date(artikel.published_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <article className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group">
      {/* Thumbnail */}
      <Link to={detailUrl} className="relative aspect-video w-full overflow-hidden bg-gray-100 block">
        {artikel.thumbnail_url ? (
          <img
            src={artikel.thumbnail_url}
            alt={artikel.judul}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-indigo-50 to-slate-100">
            <ImageIcon className="w-12 h-12 stroke-1" />
          </div>
        )}
        {artikel.kategori && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
            {artikel.kategori.nama}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <Link to={detailUrl}>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
              {artikel.judul}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {artikel.ringkasan || 'Tidak ada ringkasan artikel.'}
          </p>
        </div>

        {/* Meta Info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate font-medium text-gray-700">
              {artikel.author_name || 'Redaksi'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              {artikel.view_count || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default BlogCard
