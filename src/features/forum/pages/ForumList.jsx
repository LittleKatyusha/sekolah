import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Clock, User, Search, BookOpen, RefreshCw } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { forumService } from '../services/forumService'

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
  const gridRef = useRef(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [totalRows, setTotalRows] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchText(searchInput)
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let isMounted = true

    const fetchTotalRows = async () => {
      const { data } = await forumService.getAll({
        page: 1,
        per_page: 1,
        sort_by: 'created_at',
        sort_dir: 'desc',
        search: searchText || '',
        filter: '{}',
      })

      if (isMounted) {
        setTotalRows(data?.meta?.total || 0)
      }
    }

    fetchTotalRows()

    return () => {
      isMounted = false
    }
  }, [searchText])

  const staticParams = useMemo(() => ({
    sort_by: 'created_at',
    sort_dir: 'desc',
    search: searchText || '',
    filter: '{}',
  }), [searchText])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const columnDefs = useMemo(() => ([
    {
      field: 'judul',
      headerName: 'Topik',
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: (params) => {
        const topic = params.data
        if (!topic) return null

        const authorName = topic.user?.name || 'Unknown'
        const mapelName = topic.guru_mapel?.mapel?.nama
        const replyCount = topic.replies?.length || topic.replies_count || 0
        const preview = stripHtml(topic.pesan)

        return (
          <div
            onClick={() => navigate(`/akademik/forum/${topic.id}`)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group my-2"
          >
            <div className="flex gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getAvatarColor(authorName)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-sm sm:text-base font-semibold">
                  {getInitials(authorName)}
                </span>
              </div>

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
                    {preview.length > 150 ? `${preview.substring(0, 150)}...` : preview}
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
      },
    },
  ]), [navigate])

  const defaultColDef = useMemo(() => ({
    resizable: false,
    sortable: false,
    filter: false,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Diskusi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalRows} topik diskusi</p>
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

      <Card>
        <InfiniteGrid
          key={`forum-grid-${searchText}`}
          ref={gridRef}
          endpoint="/akademik/forum/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={15}
          paginationPageSize={15}
          paginationPageSizeSelector={[15, 30, 50, 100]}
          rowHeight={150}
          headerHeight={0}
          suppressCellFocus
          overlayNoRowsTemplate='<span class="text-gray-500">Belum ada topik diskusi</span>'
          height={700}
        />
      </Card>
    </div>
  )
}

export default ForumList