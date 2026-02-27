import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Clock, User, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { forumService } from '../services/forumService'
import { showError } from '../../../utils/sweetalert'

function timeAgo(dateString) {
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

function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
]

function getAvatarColor(name) {
  if (!name) return COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

const ForumList = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [totalRows, setTotalRows] = useState(0)
  const searchTimeout = useRef(null)

  const currentPageRef = useRef(1)
  const pageCursorsRef = useRef({ 1: null })
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 15

  const fetchTopics = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true)
    const cursorValue = pageCursorsRef.current[page]
    const params = {
      per_page: perPage,
      ...(searchQuery && { search: searchQuery }),
      ...(cursorValue && { cursor: cursorValue })
    }

    const { data, error } = await forumService.getAll(params)
    if (data) {
      setTopics(data.data || [])
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        currentPageRef.current = data.meta.current_page || page
        setCurrentPage(data.meta.current_page || page)
        if (data.meta.next_cursor) {
          pageCursorsRef.current[page + 1] = data.meta.next_cursor
        }
      }
    } else {
      console.error('Error fetching forum:', error)
      showError('Gagal mengambil data forum')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTopics(1, '')
  }, [fetchTopics])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchText(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      pageCursorsRef.current = { 1: null }
      currentPageRef.current = 1
      fetchTopics(1, value)
    }, 400)
  }

  const totalPages = Math.ceil(totalRows / perPage)
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  const goNext = () => {
    if (hasNext) fetchTopics(currentPage + 1, searchText)
  }
  const goPrev = () => {
    if (hasPrev) {
      pageCursorsRef.current = { 1: null }
      fetchTopics(currentPage - 1, searchText)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Diskusi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalRows} topik diskusi
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari topik diskusi..."
            value={searchText}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none w-full sm:w-80 transition-colors"
          />
        </div>
      </div>

      {/* Topic List */}
      {loading && topics.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : topics.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Belum ada topik diskusi</p>
          {searchText && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Tidak ditemukan hasil untuk "{searchText}"
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const authorName = topic.user?.name || 'Unknown'
            const mapelName = topic.guru_mapel?.mapel?.nama
            const replyCount = topic.replies?.length || topic.replies_count || 0
            const preview = stripHtml(topic.pesan)

            return (
              <div
                key={topic.id}
                onClick={() => navigate(`/akademik/forum/${topic.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getAvatarColor(authorName)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {getInitials(authorName)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {topic.judul || 'Tanpa Judul'}
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                        <Clock size={12} />
                        {timeAgo(topic.created_at)}
                      </span>
                    </div>

                    {preview && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {preview.length > 150 ? preview.substring(0, 150) + '...' : preview}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {authorName}
                      </span>
                      {mapelName && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={13} />
                          {mapelName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare size={13} />
                        {replyCount} balasan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForumList