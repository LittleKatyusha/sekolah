import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User, FileText, Link, Hash, AlignLeft, ExternalLink, Play, Presentation, Video, Eye, Download, ClipboardList, MessageSquare, CheckCircle2, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import useAuthStore from '../../../store/useAuthStore'
import { materiService } from '../services/materiService'
import { tugasService } from '../../tugas/services/tugasService'
import { logAksesMateriService } from '../../log-akses-materi/services/logAksesMateriService'
import { openAttachment, getFileName, hasAttachment, getAttachmentPath } from '../../tugas/utils/tugasFileUtils'
import TugasFilePreviewModal from '../../tugas/components/TugasFilePreviewModal'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const getYouTubeId = (url) => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
  return match ? match[1] : null
}

const getGoogleSlidesEmbed = (url) => {
  if (!url) return null
  const match = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  return match ? `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000` : null
}

// Status mapping for display (backend: 1 Aktif, 0 Draft)
const STATUS_MAP = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  0: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const MateriDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isSiswa =
    user?.role?.toLowerCase?.() === 'siswa' ||
    user?.roles?.some?.((r) => (r.code || r)?.toLowerCase?.() === 'siswa')
  const currentSiswaId =
    user?.profile?.id ??
    user?.profile?.mst_siswa_id ??
    user?.profile?.siswa_id ??
    user?.mst_siswa_id ??
    user?.siswa?.id ??
    ''
  
  const [loading, setLoading] = useState(false)
  const [materi, setMateri] = useState(null)
  const [relatedTugas, setRelatedTugas] = useState([])
  const [accessLogged, setAccessLogged] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  const youtubeId = useMemo(() => getYouTubeId(materi?.link_video), [materi?.link_video])
  const slidesEmbed = useMemo(() => getGoogleSlidesEmbed(materi?.link_video), [materi?.link_video])

  useEffect(() => {
    fetchMateri()
  }, [id])

  const fetchMateri = async () => {
    setLoading(true)
    const { data, error } = await materiService.getById(id)
    if (data) {
      const mData = data.data
      setMateri(mData)
      const gmId = mData?.mst_guru_mapel_id ?? mData?.guru_mapel?.id
      if (gmId) {
        fetchRelatedTugas(gmId)
      }
      if (isSiswa && currentSiswaId && mData?.id) {
        recordStudentAccess(mData.id, currentSiswaId)
      }
    } else {
      showError('Gagal mengambil data materi')
      navigate('/akademik/materi')
    }
    setLoading(false)
  }

  const fetchRelatedTugas = async (guruMapelId) => {
    try {
      const { data } = await tugasService.getByGuruMapel(guruMapelId, { status: 1 })
      if (data) {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
        setRelatedTugas(list)
      }
    } catch {
      // Non-blocking
    }
  }

  const recordStudentAccess = async (materiId, siswaId) => {
    try {
      await logAksesMateriService.create({
        mst_materi_id: Number(materiId),
        materi_id: Number(materiId),
        mst_siswa_id: Number(siswaId),
        siswa_id: Number(siswaId),
        waktu_akses: new Date().toISOString(),
        durasi_detik: 60,
      })
      setAccessLogged(true)
    } catch {
      setAccessLogged(true)
    }
  }

  const handleDelete = async () => {
    const label = `Materi "${materi.judul || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await materiService.delete(materi.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/materi')
      } else {
        showError('Gagal menghapus materi')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Helper function to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getStatusBadge = (status, statusLabel) => {
    if (status === null || status === undefined) return '-'
    const bg = STATUS_MAP[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>
        {statusLabel || String(status)}
      </span>
    )
  }

  if (loading || !materi) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const hasFile = hasAttachment(materi)
  const filePath = getAttachmentPath(materi)
  const fileUrl = materi?.file_url
  const fileName = getFileName(filePath || fileUrl)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/materi')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Materi</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/akademik/forum?search=${encodeURIComponent(materi.judul || '')}`, {
                state: {
                  relatedJudul: `Diskusi Materi: ${materi.judul || ''}`,
                  relatedMapel: materi.guru_mapel?.mapel?.nama || '',
                },
              })
            }
          >
            <MessageSquare size={18} className="mr-2" />
            Diskusi Materi
          </Button>
          <PermissionGuard permission="materi.update">
            <Button variant="warning" onClick={() => navigate(`/akademik/materi/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="materi.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {materi.judul || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2 flex-wrap">
                {getStatusBadge(materi.status, materi.status_label)}
                {isSiswa && accessLogged && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> Dipelajari
                  </span>
                )}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{materi.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tugas Mapel Ini</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {relatedTugas.length} tugas
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Judul</p>
                    <p className="font-medium text-gray-900 dark:text-white">{materi.judul || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru / Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {materi.guru_mapel?.guru?.nama || '-'}
                    </p>
                    {materi.guru_mapel?.mapel?.nama && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mapel: {materi.guru_mapel.mapel.nama}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(materi.status, materi.status_label)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">File / Modul Materi</p>
                    {hasFile ? (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline text-left"
                          title="Pratinjau Modul Materi"
                        >
                          <Eye size={14} className="shrink-0" />
                          <span className="truncate max-w-[160px]">{fileName}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openAttachment(filePath, fileUrl)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                          title="Buka / Unduh Modul"
                        >
                          <Download size={12} />
                          <span>Unduh</span>
                        </button>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Link Video</p>
                    {materi.link_video ? (
                      <a
                        href={materi.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:underline break-all"
                      >
                        <span>{materi.link_video}</span>
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Embed Player */}
              {youtubeId && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Video size={18} className="text-rose-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Video Pembelajaran</h4>
                  </div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                      title={materi.judul || 'Video Materi'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {slidesEmbed && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Presentation size={18} className="text-amber-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Slide Presentasi</h4>
                  </div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
                    <iframe
                      src={slidesEmbed}
                      title={materi.judul || 'Slide Materi'}
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* Deskripsi Section */}
              {materi.deskripsi && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlignLeft size={16} className="text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Deskripsi</h4>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{stripHtmlTags(materi.deskripsi)}</p>
                  </div>
                </div>
              )}

              {/* Tugas Terkait Mata Pelajaran Ini */}
              {relatedTugas.length > 0 && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Tugas Terkait Mata Pelajaran Ini ({relatedTugas.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/akademik/tugas?mapel=${encodeURIComponent(
                            materi.guru_mapel?.mapel?.nama || ''
                          )}`
                        )
                      }
                      className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Lihat Semua Tugas Mapel Ini
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedTugas.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/akademik/tugas/${t.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate(`/akademik/tugas/${t.id}`)
                          }
                        }}
                        className="p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {t.judul}
                          </p>
                          {t.tenggat_waktu && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <Calendar size={11} />
                              <span>Tenggat: {formatDate(t.tenggat_waktu)}</span>
                            </p>
                          )}
                        </div>
                        <ExternalLink size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(materi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(materi.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <TugasFilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        filePath={filePath}
        fileUrl={fileUrl}
        title={`Modul: ${materi.judul || 'Materi'}`}
        subtitle={fileName}
      />
    </div>
  )
}

export default MateriDetail