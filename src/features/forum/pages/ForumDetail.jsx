import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Wifi, WifiOff, Edit2, Trash2, MessageSquare, Paperclip, BookOpen, User, Clock, ArrowDown } from 'lucide-react'
import DOMPurify from 'dompurify'
import useNotificationStore from '../../../store/useNotificationStore'
import useAuthStore from '../../../store/useAuthStore'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { forumService } from '../services/forumService'
import { timeAgo, getInitials, getAvatarColor, stripHtml } from '../utils/forumHelpers'
import ReplyCard from '../components/ReplyCard'
import TopicHeader from '../components/TopicHeader'
import useForumWebSocket from '../hooks/useForumWebSocket'
import { showConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'

const ForumDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newReplyCount, setNewReplyCount] = useState(0)

  const repliesEndRef = useRef(null)
  const isTypingRef = useRef(false)
  const repliesContainerRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Fetch topic with AbortController
  const fetchTopic = useCallback(async (signal) => {
    setLoading(true)
    const { data, error } = await forumService.getById(id, { signal })
    if (error === 'cancelled') {
      return
    }
    if (data) {
      setTopic(data)
    } else if (error) {
      showError('Gagal mengambil data topik')
      navigate('/akademik/forum')
    }
    setLoading(false)
  }, [id, navigate])

  // Fetch replies with AbortController
  const fetchReplies = useCallback(async (signal) => {
    setRepliesLoading(true)
    const { data, error } = await forumService.getReplies(id, { signal })
    if (error === 'cancelled') {
      return
    }
    if (data) {
      setReplies(data || [])
    }
    setRepliesLoading(false)
  }, [id])

  // Initial fetch with AbortController
  useEffect(() => {
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    fetchTopic(signal)
    fetchReplies(signal)

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchTopic, fetchReplies])

  // WebSocket integration
  const wsStatus = useNotificationStore(s => s.wsStatus)
  const isLive = wsStatus === 'connected'

  const isScrolledToBottom = useCallback(() => {
    if (!repliesContainerRef.current) return true
    const el = repliesContainerRef.current
    return el.getBoundingClientRect().bottom <= window.innerHeight + 100
  }, [])

  const handleNewReply = useCallback((data) => {
    setReplies(prev => {
      const exists = prev.some(r => r.id === data.id)
      if (exists) return prev
      const next = [...prev, data]
      if (isScrolledToBottom()) {
        setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        setNewReplyCount(0)
      } else {
        setNewReplyCount(c => c + 1)
      }
      return next
    })
  }, [isScrolledToBottom])

  const handleReplyDeleted = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    fetchReplies(abortControllerRef.current.signal)
  }, [fetchReplies])

  // Use the WebSocket hook
  useForumWebSocket(topic?.id, {
    onNewReply: handleNewReply,
    onReplyDeleted: handleReplyDeleted
  })

  // Fallback polling (15 s) when WebSocket is not available
  useEffect(() => {
    if (!topic || isLive) return

    const fallbackPoll = async () => {
      if (isTypingRef.current) return
      try {
        const { data } = await forumService.getReplies(topic.id)
        const freshReplies = data || []
        setReplies(prev => {
          if (freshReplies.length > prev.length) {
            const newCount = freshReplies.length - prev.length
            if (isScrolledToBottom()) {
              setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
              setNewReplyCount(0)
            } else {
              setNewReplyCount(newCount)
            }
          }
          return freshReplies
        })
      } catch {
        // silent
      }
    }

    const interval = setInterval(fallbackPoll, 15_000)
    return () => clearInterval(interval)
  }, [topic, isLive, isScrolledToBottom])

  // Track typing state
  const handleReplyChange = useCallback((html) => {
    setReplyText(html)
    isTypingRef.current = true
    clearTimeout(handleReplyChange._timeout)
    handleReplyChange._timeout = setTimeout(() => {
      isTypingRef.current = false
    }, 2000)
  }, [])

  // Submit reply with validation
  const handleSubmitReply = useCallback(async () => {
    const cleanText = stripHtml(replyText).trim()
    if (!cleanText) {
      showError('Pesan balasan tidak boleh kosong')
      return
    }

    setSubmitting(true)
    const { error } = await forumService.create({
      parent_id: parseInt(id),
      pesan: replyText,
      sys_user_id: user?.id,
      mst_guru_mapel_id: topic?.mst_guru_mapel_id || topic?.guru_mapel?.id
    })

    if (!error) {
      showSuccess('Balasan berhasil dikirim!')
      setReplyText('')
      isTypingRef.current = false
      setNewReplyCount(0)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      await fetchReplies(abortControllerRef.current.signal)
      setTimeout(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      showError('Gagal mengirim balasan')
    }
    setSubmitting(false)
  }, [replyText, id, user?.id, topic, fetchReplies])

  // Delete reply handler
  const handleDeleteReply = useCallback(async (reply) => {
    const label = `Balasan dari "${reply.user?.name || 'Unknown'}"`
    const result = await showConfirm(
      `Apakah Anda yakin ingin menghapus ${label}?`,
      'Konfirmasi Hapus'
    )

    if (!result?.isConfirmed) return

    const { error } = await forumService.delete(reply.id)
    if (!error) {
      showSuccess('Balasan berhasil dihapus!')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      fetchReplies(abortControllerRef.current.signal)
    } else {
      showError('Gagal menghapus balasan')
    }
  }, [fetchReplies])

  // Edit reply handler
  const handleEditReply = useCallback((reply) => {
    navigate(`/akademik/forum/${reply.id}/edit`)
  }, [navigate])

  // Loading state
  if (loading || !topic) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const topicAuthor = topic.user?.name || 'Unknown'
  const mapelName = topic.guru_mapel?.mapel?.nama
  const guruName = topic.guru_mapel?.guru?.nama
  const isTopicOwner = user?.id === (topic.user?.id || topic.sys_user_id)

  // Sanitize HTML content with DOMPurify
  const sanitizedTopicContent = DOMPurify.sanitize(topic.pesan || '')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/akademik/forum')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Kembali ke Forum</span>
      </button>

      {/* Topic Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-full ${getAvatarColor(topicAuthor)} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold">{getInitials(topicAuthor)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {topic.judul || 'Tanpa Judul'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User size={14} />
                {topicAuthor}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {timeAgo(topic.created_at)}
              </span>
              {mapelName && (
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {mapelName}
                  {guruName && ` — ${guruName}`}
                </span>
              )}
            </div>

            {/* Topic body - sanitized */}
            <div
              className="prose dark:prose-invert max-w-none mt-4 text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: sanitizedTopicContent }}
            />

            {topic.file_lampiran && (
              <div className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                <Paperclip size={14} />
                <a href={topic.file_lampiran} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {topic.file_lampiran}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div ref={repliesContainerRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} />
            Balasan ({replies.length})
          </h2>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <Wifi size={12} />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <WifiOff size={12} />
              Polling (15 s)
            </span>
          )}
        </div>

        {repliesLoading && replies.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : replies.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada balasan. Jadilah yang pertama!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              const replyAuthor = reply.user?.name || 'Unknown'
              const isOwner = user?.id === (reply.user?.id || reply.sys_user_id)
              const sanitizedReplyContent = DOMPurify.sanitize(reply.pesan || '')

              return (
                <div
                  key={reply.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5"
                >
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full ${getAvatarColor(replyAuthor)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-semibold">{getInitials(replyAuthor)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {replyAuthor}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock size={11} />
                            {timeAgo(reply.created_at)}
                          </span>
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <PermissionGuard permission="forum.edit">
                              <button
                                onClick={() => handleEditReply(reply)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="forum.delete">
                              <button
                                onClick={() => handleDeleteReply(reply)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </PermissionGuard>
                          </div>
                        )}
                      </div>

                      <div
                        className="prose dark:prose-invert max-w-none mt-2 text-sm text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: sanitizedReplyContent }}
                      />

                      {reply.file_lampiran && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400">
                          <Paperclip size={12} />
                          <a href={reply.file_lampiran} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {reply.file_lampiran}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={repliesEndRef} />
          </div>
        )}

        {/* New reply indicator */}
        {newReplyCount > 0 && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => {
                setNewReplyCount(0)
                repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="sticky bottom-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10 text-sm font-medium"
            >
              <ArrowDown className="w-4 h-4" />
              {newReplyCount} balasan baru
            </button>
          </div>
        )}
      </div>

      {/* Reply Composer */}
      <PermissionGuard permission="forum.create">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tulis Balasan</h3>
          <LexicalEditor
            value={replyText}
            onChange={handleReplyChange}
            placeholder="Tulis balasan Anda..."
            minHeight="120px"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitReply}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim Balasan
                </>
              )}
            </button>
          </div>
        </div>
      </PermissionGuard>
    </div>
  )
}

export default ForumDetail
