import React from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'

export const BlogCard = ({ artikel, schoolQuery = '' }) => {
  const detailUrl = `/blog/${artikel.slug}${schoolQuery ? `?${schoolQuery}` : ''}`

  const formattedDate = artikel.published_at
    ? new Date(artikel.published_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <article className="flex flex-col bg-white border border-[#eaece8] rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
      {/* Thumbnail */}
      <Link to={detailUrl} className="block aspect-[16/9] overflow-hidden bg-[#eaece8] relative">
        {artikel.thumbnail_url ? (
          <img
            src={artikel.thumbnail_url}
            alt={artikel.judul}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#52605b]/30 bg-gradient-to-br from-emerald-50 to-[#eaece8]">
            <ImageIcon className="w-12 h-12 stroke-1 text-[#245a49]/30" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center flex-wrap gap-2 text-xs text-[#52605b] mb-3">
          {artikel.kategori?.nama && (
            <span className="bg-[#eef5f2] text-[#245a49] font-semibold px-2.5 py-1 rounded text-xs">
              {artikel.kategori.nama}
            </span>
          )}
          {formattedDate && <time dateTime={artikel.published_at}>{formattedDate}</time>}
        </div>

        <h2 className="text-lg font-bold text-[#14231f] group-hover:text-[#245a49] transition-colors line-clamp-2 leading-snug mb-2">
          <Link to={detailUrl}>{artikel.judul}</Link>
        </h2>

        {artikel.ringkasan && (
          <p className="text-sm text-[#52605b] line-clamp-3 leading-relaxed mb-4">
            {artikel.ringkasan}
          </p>
        )}

        <div className="mt-auto pt-3.5 border-t border-[#eaece8] flex items-center justify-between text-xs">
          <span className="text-[#52605b] font-medium">{artikel.author_name || 'Tim Redaksi'}</span>
          <Link
            to={detailUrl}
            className="text-[#245a49] hover:underline font-semibold flex items-center gap-0.5"
          >
            Baca ↗
          </Link>
        </div>
      </div>
    </article>
  )
}

export default BlogCard
