import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Clock, User } from 'lucide-react'
import DOMPurify from 'dompurify'
import { forumService } from '../services/forumService'
import { getAvatarColor, getInitials, timeAgo } from '../utils/forumHelpers'
import { showError } from '../../../utils/sweetalert'

const ForumDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTopic = useCallback(async (signal) => {
    setLoading(true)
    const { data, error } = await forumService.getById(id, { signal })
    if (error === 'cancelled') return
    if (data) setTopic(data)
    else {
      showError('Gagal mengambil data topik')
      navigate('/akademik/forum')
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    const controller = new AbortController()
    fetchTopic(controller.signal)
    return () => controller.abort()
  }, [fetchTopic])

  if (loading || !topic) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>

  const author = topic.createdBy?.name || 'Unknown'
  const mapelName = topic.mapel?.nama
  const kelasName = topic.kelas?.nama

  return <div className="space-y-6 max-w-4xl mx-auto">
    <button onClick={() => navigate('/akademik/forum')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
      <ArrowLeft size={18} /><span className="text-sm font-medium">Kembali ke Forum</span>
    </button>
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-full ${getAvatarColor(author)} flex items-center justify-center flex-shrink-0`}><span className="text-white font-semibold">{getInitials(author)}</span></div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{topic.judul || 'Tanpa Judul'}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><User size={14} />{author}</span>
            <span className="flex items-center gap-1"><Clock size={14} />{timeAgo(topic.created_at)}</span>
            {mapelName && <span className="flex items-center gap-1"><BookOpen size={14} />{mapelName}{kelasName && ` - ${kelasName}`}</span>}
          </div>
          <div className="prose dark:prose-invert max-w-none mt-4 text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(topic.konten || '') }} />
        </div>
      </div>
    </article>
  </div>
}

export default ForumDetail
