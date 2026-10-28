import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User, Calendar, FileText, Hash, ClipboardList, Upload, CheckCircle2, Download, ExternalLink, Eye } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import useAuthStore from '../../../store/useAuthStore'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { hasAttachment, getAttachmentPath, openAttachment, getFileName, isSubmissionGraded, getSubmissionScore } from '../utils/tugasFileUtils'
import TugasFilePreviewModal from '../components/TugasFilePreviewModal'

// Status mapping for display
const STATUS_MAP = {
  1: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  aktif: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  nonaktif: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const SUBMISSION_STATUS_MAP = {
  'tepat waktu': { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  belum: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  terlambat: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  dinilai: { label: 'Sudah Dinilai', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  1: { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  2: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  3: { label: 'Sudah Dinilai', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const TugasDetail = () => {
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
  const [tugas, setTugas] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [studentSubmission, setStudentSubmission] = useState(null)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [previewModal, setPreviewModal] = useState({
    open: false,
    filePath: '',
    fileUrl: '',
    title: '',
    subtitle: '',
  })

  const handleOpenPreview = (rawPath, directUrl, title, subtitle) => {
    setPreviewModal({
      open: true,
      filePath: rawPath,
      fileUrl: directUrl,
      title: title || 'Pratinjau Berkas',
      subtitle: subtitle || getFileName(rawPath || directUrl),
    })
  }

  useEffect(() => {
    fetchTugas()
    fetchSubmissions()
  }, [id])

  const fetchTugas = async () => {
    setLoading(true)
    const { data, error } = await tugasService.getById(id)
    if (data) {
      setTugas(data.data)
    } else {
      showError('Gagal mengambil data tugas')
      navigate('/akademik/tugas')
    }
    setLoading(false)
  }

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true)
    if (isSiswa && currentSiswaId) {
      const { data } = await tugasSiswaService.getBySiswa(currentSiswaId, { tugas_id: id })
      if (data) {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
        const matched =
          list.find((s) => String(s.tugas_id ?? s.mst_tugas_id ?? s.tugas?.id) === String(id)) ||
          list[0] ||
          null
        setStudentSubmission(matched)
      }
    } else {
      const { data } = await tugasSiswaService.getByTugas(id)
      if (data) {
        setSubmissions(data.data || [])
      }
    }
    setLoadingSubmissions(false)
  }

  const handleDelete = async () => {
    const label = `Tugas "${tugas.judul || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await tugasService.delete(tugas.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/tugas')
      } else {
        showError('Gagal menghapus tugas')
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    if (status === null || status === undefined) return '-'
    const statusKey = String(status).toLowerCase()
    const statusInfo = STATUS_MAP[status] || STATUS_MAP[statusKey] || { label: String(status), bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getSubmissionStatusBadge = (status) => {
    if (status === null || status === undefined) return '-'
    const statusKey = String(status).toLowerCase()
    const statusInfo = SUBMISSION_STATUS_MAP[status] || SUBMISSION_STATUS_MAP[statusKey] || { label: String(status), bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading || !tugas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/tugas')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Tugas</h1>
        </div>
        <div className="flex gap-3">
          {isSiswa && !studentSubmission && (
            <Button
              onClick={() =>
                navigate('/akademik/tugas-siswa/create', { state: { mst_tugas_id: String(id) } })
              }
            >
              <Upload size={18} className="mr-2" />
              Kumpulkan Tugas
            </Button>
          )}
          <PermissionGuard permission="tugas.update">
            <Button variant="warning" onClick={() => navigate(`/akademik/tugas/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="tugas.delete">
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
                <ClipboardList size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {tugas.judul || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(tugas.status)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tugas.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pengumpulan</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {submissions.length} siswa
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
                    <p className="font-medium text-gray-900 dark:text-white">{tugas.judul || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru / Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tugas.guru_mapel?.guru?.nama || '-'}
                    </p>
                    {tugas.guru_mapel?.mapel?.nama && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mapel: {tugas.guru_mapel.mapel.nama}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tugas.kelas?.nama_kelas || tugas.kelas?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tenggat Waktu</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(tugas.tenggat_waktu)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">File Lampiran Tugas</p>
                    {hasAttachment(tugas) ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPreview(
                            getAttachmentPath(tugas),
                            tugas.file_url,
                            `Lampiran: ${tugas.judul || 'Tugas'}`,
                            getFileName(getAttachmentPath(tugas))
                          )
                        }
                        className="inline-flex items-center gap-1.5 mt-0.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline text-left"
                        title="Lihat Pratinjau File Lampiran"
                      >
                        <Eye size={14} className="shrink-0" />
                        <span className="truncate max-w-[150px]">{getFileName(getAttachmentPath(tugas))}</span>
                      </button>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(tugas.status)}</div>
                  </div>
                </div>
              </div>

              {/* Deskripsi Section */}
              {tugas.deskripsi && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Deskripsi</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tugas.deskripsi}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(tugas.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(tugas.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submissions Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isSiswa ? 'Status Pengumpulan Tugas' : `Pengumpulan Siswa (${submissions.length})`}
          </h3>
          
          {loadingSubmissions ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : isSiswa ? (
            studentSubmission ? (
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Tugas Sudah Dikumpulkan
                    </span>
                  </div>
                  {getSubmissionStatusBadge(
                    studentSubmission.status_label ??
                      studentSubmission.status_kumpul_label ??
                      studentSubmission.status
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm pt-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Waktu Kumpul</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(studentSubmission.waktu_kumpul || studentSubmission.waktu_kumpl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nilai</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {isSubmissionGraded(studentSubmission)
                        ? `${getSubmissionScore(studentSubmission)} / 100`
                        : 'Menunggu Koreksi'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Berkas Anda</p>
                    {hasAttachment(studentSubmission) ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPreview(
                            getAttachmentPath(studentSubmission),
                            studentSubmission.file_url,
                            'Berkas Tugas Anda',
                            getFileName(getAttachmentPath(studentSubmission))
                          )
                        }
                        className="inline-flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-primary-600 hover:underline"
                        title="Lihat Pratinjau Berkas Anda"
                      >
                        <Eye size={13} />
                        <span className="truncate max-w-[120px]">{getFileName(getAttachmentPath(studentSubmission))}</span>
                      </button>
                    ) : (
                      <p className="text-xs text-gray-500 italic mt-0.5">Tidak melampirkan berkas</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Catatan Guru</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {studentSubmission.catatan_guru || studentSubmission.catatan || '-'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/akademik/tugas-siswa/${studentSubmission.id}`)}
                  >
                    Lihat Detail Pengumpulan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-gray-500 dark:text-gray-400">
                  Anda belum mengumpulkan tugas ini.
                </p>
                <Button
                  onClick={() =>
                    navigate('/akademik/tugas-siswa/create', { state: { mst_tugas_id: String(id) } })
                  }
                >
                  <Upload size={16} className="mr-2" />
                  Kumpulkan Tugas Sekarang
                </Button>
              </div>
            )
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada pengumpulan tugas dari siswa
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Tanggal Kumpul</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Nilai</th>
                    <th className="px-4 py-3 text-center">File Tugas</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr key={submission.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {submission.siswa?.nama || submission.siswa?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatDateTime(submission.waktu_kumpul || submission.waktu_kumpl)}
                      </td>
                      <td className="px-4 py-3">
                        {getSubmissionStatusBadge(
                          submission.status_label
                          ?? submission.status_kumpul_label
                          ?? submission.status_kumpl_label
                          ?? submission.status
                          ?? submission.status_kumpul
                          ?? submission.status_kumpl
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {isSubmissionGraded(submission) ? (
                          getSubmissionScore(submission)
                        ) : (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Menunggu Koreksi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasAttachment(submission) ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenPreview(
                                getAttachmentPath(submission),
                                submission.file_url,
                                `Tugas: ${submission.siswa?.nama || submission.siswa?.name || 'Siswa'}`,
                                getFileName(getAttachmentPath(submission))
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-300 dark:bg-primary-950/40 dark:hover:bg-primary-900/50 transition-colors"
                            title={`Pratinjau ${getFileName(getAttachmentPath(submission))}`}
                          >
                            <Eye size={14} />
                            <span>Preview File</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/akademik/tugas-siswa/${submission.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <TugasFilePreviewModal
        isOpen={previewModal.open}
        onClose={() => setPreviewModal((prev) => ({ ...prev, open: false }))}
        filePath={previewModal.filePath}
        fileUrl={previewModal.fileUrl}
        title={previewModal.title}
        subtitle={previewModal.subtitle}
      />
    </div>
  )
}

export default TugasDetail