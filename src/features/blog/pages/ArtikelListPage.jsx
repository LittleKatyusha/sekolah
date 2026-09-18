import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  Archive,
  Eye,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { blogService } from '../services/blogService'
import { ArtikelStatusBadge } from '../components/ArtikelStatusBadge'
import { ReviewModal } from '../components/ReviewModal'
import usePermission from '../../../hooks/usePermission'
import useAuthStore from '../../../store/useAuthStore'
import { showToast, showConfirm } from '../../../utils/sweetalert'

const TABS = [
  { key: 'all', label: 'Semua Status' },
  { key: 'draft', label: 'Draf' },
  { key: 'pending', label: 'Menunggu Review' },
  { key: 'published', label: 'Terbit' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'archived', label: 'Arsip' },
]

export const ArtikelListPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { hasPermission } = usePermission()

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Review modal state
  const [selectedArtikel, setSelectedArtikel] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('approve')
  const [actionLoading, setActionLoading] = useState(false)

  const canCreate = hasPermission('artikel.create')
  const canEdit = hasPermission('artikel.edit')
  const canPublish = hasPermission('artikel.publish')
  const canDelete = hasPermission('artikel.delete')

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: meta.current_page,
        per_page: 10,
        status: activeTab === 'all' ? undefined : activeTab,
        search: search.trim() || undefined,
      }
      const { data, error } = await blogService.getAll(params)
      if (error) {
        showToast(typeof error === 'string' ? error : (error.message || 'Gagal memuat artikel'), 'error')
      } else {
        setArticles(data?.data || [])
        setMeta(data?.meta || { current_page: 1, last_page: 1, total: 0 })
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, meta.current_page])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleTabChange = (key) => {
    setActiveTab(key)
    setMeta((prev) => ({ ...prev, current_page: 1 }))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setMeta((prev) => ({ ...prev, current_page: 1 }))
  }

  const handleSubmitForReview = async (artikel) => {
    const confirmed = await showConfirm(
      'Ajukan Review Artikel?',
      `Artikel "${artikel.judul}" akan diajukan ke tim editor untuk ditinjau.`,
      'Ya, Ajukan'
    )
    if (!confirmed) return

    try {
      const { error } = await blogService.submit(artikel.id)
      if (error) {
        showToast(typeof error === 'string' ? error : (error.message || 'Gagal mengajukan artikel'), 'error')
      } else {
        showToast('Artikel berhasil diajukan untuk review', 'success')
        fetchArticles()
      }
    } catch {
      showToast('Gagal memproses pengajuan', 'error')
    }
  }

  const handleArchive = async (artikel) => {
    const confirmed = await showConfirm(
      'Tarik ke Arsip?',
      `Artikel "${artikel.judul}" tidak akan lagi muncul di portal publik.`,
      'Ya, Arsipkan'
    )
    if (!confirmed) return

    try {
      const { error } = await blogService.archive(artikel.id)
      if (error) {
        showToast(typeof error === 'string' ? error : (error.message || 'Gagal mengarsipkan artikel'), 'error')
      } else {
        showToast('Artikel berhasil diarsipkan', 'success')
        fetchArticles()
      }
    } catch {
      showToast('Gagal memproses arsip artikel', 'error')
    }
  }

  const handleDelete = async (artikel) => {
    const confirmed = await showConfirm(
      'Hapus Artikel?',
      `Artikel "${artikel.judul}" akan dihapus. Aksi ini tidak dapat dibatalkan.`,
      'Ya, Hapus',
      'warning'
    )
    if (!confirmed) return

    try {
      const { error } = await blogService.delete(artikel.id)
      if (error) {
        showToast(typeof error === 'string' ? error : (error.message || 'Gagal menghapus artikel'), 'error')
      } else {
        showToast('Artikel berhasil dihapus', 'success')
        fetchArticles()
      }
    } catch {
      showToast('Gagal memproses penghapusan artikel', 'error')
    }
  }

  const openReviewModal = (artikel, action = 'approve') => {
    setSelectedArtikel(artikel)
    setModalAction(action)
    setModalOpen(true)
  }

  const handleReviewSubmit = async ({ action, artikelId, rejectionNote }) => {
    setActionLoading(true)
    try {
      let res
      if (action === 'approve') {
        res = await blogService.approve(artikelId)
      } else {
        res = await blogService.reject(artikelId, rejectionNote)
      }

      if (res.error) {
        showToast(typeof res.error === 'string' ? res.error : (res.error.message || 'Gagal memproses aksi review'), 'error')
      } else {
        showToast(
          action === 'approve'
            ? 'Artikel berhasil disetujui dan terbit!'
            : 'Artikel berhasil ditolak dengan catatan',
          'success'
        )
        setModalOpen(false)
        setSelectedArtikel(null)
        fetchArticles()
      }
    } catch {
      showToast('Terjadi kesalahan pada sistem review', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Artikel & Berita</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola publikasi, artikel, berita, dan karya tulis warga sekolah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Link
              to="/artikel/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Artikel</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between px-4 py-2 gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul artikel..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </form>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
            <span className="text-sm">Memuat artikel...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Tidak ada artikel</p>
            <p className="text-xs text-gray-500">
              {activeTab === 'all'
                ? 'Belum ada artikel yang dibuat. Mulai tulis artikel baru.'
                : `Tidak ada artikel dengan status "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Artikel</th>
                  <th className="px-4 py-3">Penulis</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal / Views</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.map((item) => {
                  const isAuthor = user && item.author_user_id === user.id
                  const canSelfEdit = isAuthor && (item.status === 'draft' || item.status === 'rejected')
                  const canAdminEdit = canEdit && (user?.role === 'admin' || user?.role === 'superadmin' || user?.role?.code === 'admin_sekolah')
                  const isEditable = canSelfEdit || canAdminEdit
                  const isSubmittable = isAuthor && (item.status === 'draft' || item.status === 'rejected')
                  const isPending = item.status === 'pending'
                  const isPublished = item.status === 'published'

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="font-semibold text-gray-900 line-clamp-1">{item.judul}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.kategori && (
                              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {item.kategori.nama}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 font-mono">/{item.slug}</span>
                          </div>
                          {item.rejection_note && item.status === 'rejected' && (
                            <div className="mt-2 text-xs bg-rose-50 text-rose-700 p-2 rounded border border-rose-200">
                              <span className="font-semibold">Catatan Reviewer:</span> {item.rejection_note}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.author_name}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.author_type}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ArtikelStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div>
                          {item.published_at
                            ? new Date(item.published_at).toLocaleDateString('id-ID')
                            : new Date(item.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                          <Eye className="w-3 h-3" />
                          <span>{item.view_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                        {/* Public Link if published */}
                        {isPublished && (
                          <Link
                            to={`/blog/${item.slug}`}
                            target="_blank"
                            title="Buka Halaman Publik"
                            className="inline-flex p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Submit For Review button */}
                        {isSubmittable && (
                          <button
                            type="button"
                            onClick={() => handleSubmitForReview(item)}
                            title="Ajukan Review"
                            className="inline-flex p-1.5 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reviewer Actions (Publish / Reject) */}
                        {isPending && canPublish && (!isAuthor || user?.role === 'superadmin' || user?.role?.code === 'superadmin') && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReviewModal(item, 'approve')}
                              title="Setujui / Tolak"
                              className="inline-flex p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Archive button */}
                        {isPublished && canPublish && (
                          <button
                            type="button"
                            onClick={() => handleArchive(item)}
                            title="Arsipkan Artikel"
                            className="inline-flex p-1.5 text-zinc-600 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit button */}
                        {isEditable && (
                          <button
                            type="button"
                            onClick={() => navigate(`/artikel/${item.id}/edit`)}
                            title="Edit Artikel"
                            className="inline-flex p-1.5 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete button */}
                        {(canDelete || isAuthor) && (item.status === 'draft' || item.status === 'rejected' || user?.role === 'admin' || user?.role === 'superadmin') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus Artikel"
                            className="inline-flex p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
            <span>
              Menampilkan {articles.length} dari {meta.total} artikel
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setMeta((p) => ({ ...p, current_page: p.current_page - 1 }))}
                className="px-2.5 py-1 border rounded bg-white disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span>{meta.current_page} / {meta.last_page}</span>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setMeta((p) => ({ ...p, current_page: p.current_page + 1 }))}
                className="px-2.5 py-1 border rounded bg-white disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleReviewSubmit}
        artikel={selectedArtikel}
        initialAction={modalAction}
        loading={actionLoading}
      />
    </div>
  )
}

export default ArtikelListPage
