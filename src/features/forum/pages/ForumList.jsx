import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Clock, User, Search, BookOpen, RefreshCw, Loader2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { forumService } from '../services/forumService'
import { timeAgo, getInitials, getAvatarColor, stripHtml, truncateText } from '../utils/forumHelpers'

const ForumList = () => {
  const navigate = useNavigate()
  const loaderRef = useRef(null)
  const isFetchingRef = useRef(false)
  const currentPageRef = useRef(0)
  const topicsCountRef = useRef(0)
  const hasMoreRef = useRef(true)

  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [topics, setTopics] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const perPage = 15

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchText(searchInput)
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchInput])

  const fetchTopics = useCallback(async (pageNum, reset = false) => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setIsLoading(true)
    setErrorMessage('')

    try {
      const { data } = await forumService.getAll({
        page: pageNum,
        per_page: perPage,
        sort_by: 'created_at',
        sort_dir: 'desc',
        search: searchText || '',
        filter: '{}',
      })

      const newTopics = data?.data || []
      const total = data?.meta?.total || 0

      setTotalRows(total)
      setTopics(prev => (reset ? newTopics : [...prev, ...newTopics]))

      const mergedCount = reset
        ? newTopics.length
        : topicsCountRef.current + newTopics.length

      topicsCountRef.current = mergedCount
      currentPageRef.current = pageNum
      setPage(pageNum)

      const nextHasMore = mergedCount < total
      hasMoreRef.current = nextHasMore
      setHasMore(nextHasMore)
    } catch (error) {
      console.error('Error fetching topics:', error)
      setErrorMessage('Gagal memuat topik diskusi. Silakan coba lagi.')
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
    }
  }, [searchText])

  // Reset and fetch when search changes
  useEffect(() => {
    topicsCountRef.current = 0
    currentPageRef.current = 0
    hasMoreRef.current = true
    setErrorMessage('')
    setTopics([])
    setPage(1)
    setHasMore(true)
    fetchTopics(1, true)
  }, [searchText, fetchTopics])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        if (!hasMoreRef.current || isFetchingRef.current) return

        const nextPage = currentPageRef.current + 1
        fetchTopics(nextPage)
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const node = loaderRef.current
    if (node) observer.observe(node)

    return () => observer.disconnect()
  }, [fetchTopics])

  const handleRefresh = useCallback(() => {
    topicsCountRef.current = 0
    currentPageRef.current = 0
    hasMoreRef.current = true
    setErrorMessage('')
    setTopics([])
    setPage(1)
    setHasMore(true)
    fetchTopics(1, true)
  }, [fetchTopics])

  const handleTopicClick = useCallback((topicId) => {
    navigate(`/akademik/forum/${topicId}`)
  }, [navigate])

  // Topic card component - memoized for performance
  const TopicCard = useCallback(({ topic }) => {
    const authorName = topic.is_anonymous ? 'Anonim' : (topic.createdBy?.name || 'Unknown')
    const mapelName = topic.mapel?.nama_mapel
    const replyCount = topic.reply_count || 0
    const preview = truncateText(stripHtml(topic.konten), 180)

    return (
      <article
        onClick={() => handleTopicClick(topic.id)}
        className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
      >
        <div className="flex gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full ${getAvatarColor(authorName)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white text-sm font-semibold">
              {getInitials(authorName)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Title and Timestamp */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                {topic.judul || 'Tanpa Judul'}
              </h3>
              <time className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                <Clock size={12} />
                {timeAgo(topic.created_at)}
              </time>
            </div>

            {/* Preview */}
            {preview && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                {preview}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-gray-400 dark:text-gray-500" />
                <span className="font-medium text-gray-600 dark:text-gray-300">{authorName}</span>
              </span>
              {mapelName && (
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">{mapelName}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <MessageSquare size={13} className="text-primary-500" />
                <span className="font-medium text-gray-700 dark:text-gray-200">{replyCount} balasan</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    )
  }, [handleTopicClick])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Diskusi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalRows} topik diskusi
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari topik diskusi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none w-full sm:w-80 transition-colors"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Topics List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {errorMessage && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {topics.length === 0 && !isLoading ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada topik diskusi</p>
              {searchText && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Coba ubah kata kunci pencarian
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className={`p-4 ${index !== topics.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''} hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors`}
                >
                  <TopicCard topic={topic} />
                </div>
              ))}
            </div>
          )}

          {/* Loading Indicator / Infinite Scroll Trigger */}
          <div
            ref={loaderRef}
            className={`py-6 flex justify-center items-center gap-2 ${!isLoading && !hasMore ? 'hidden' : ''}`}
          >
            {isLoading && (
              <>
                <Loader2 className="animate-spin text-primary-500" size={20} />
                <span className="text-sm text-gray-500 dark:text-gray-400">Memuat...</span>
              </>
            )}
            {!hasMore && topics.length > 0 && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Semua topik telah dimuat
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ForumList
