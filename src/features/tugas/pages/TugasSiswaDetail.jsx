import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, BookOpen, Calendar, FileText, Hash, Star, Save, MessageSquare, Download, ExternalLink, Image as ImageIcon, FileCheck, Eye } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { tugasSiswaService } from '../services/tugasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { isImageFile, isPdfFile, getFileName, hasAttachment, getAttachmentPath, openAttachment, isSubmissionGraded, getSubmissionScore } from '../utils/tugasFileUtils'
import TugasFilePreviewModal from '../components/TugasFilePreviewModal'

// Submission status mapping
const STATUS_MAP = {
  'tepat waktu': { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  belum: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  terlambat: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  dinilai: { label: 'Sudah Dinilai', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  1: { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  2: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  3: { label: 'Sudah Dinilai', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const TugasSiswaDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [loading, setLoading] = useState(false)
  const [tugasSiswa, setTugasSiswa] = useState(null)
  const [showGradeForm, setShowGradeForm] = useState(location.state?.openGrade || false)
  const [gradeData, setGradeData] = useState({ nilai: '', catatan: '' })
  const [gradeLoading, setGradeLoading] = useState(false)
  const [gradeErrors, setGradeErrors] = useState({})
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  useEffect(() => {
    fetchTugasSiswa()
  }, [id])

  const fetchTugasSiswa = async () => {
    setLoading(true)
    const { data, error } = await tugasSiswaService.getById(id)
    if (data) {
      const ts = data.data
      setTugasSiswa(ts)
      setGradeData({
        nilai: isSubmissionGraded(ts) ? String(getSubmissionScore(ts)) : '',
        catatan_guru: ts.catatan_guru || ts.catatan || ''
      })
    } else {
      showError('Gagal mengambil data tugas siswa')
      navigate('/akademik/tugas-siswa')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Pengumpulan tugas #${tugasSiswa.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await tugasSiswaService.delete(tugasSiswa.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/tugas-siswa')
      } else {
        showError('Gagal menghapus data')
      }
    }
  }

  const handleGradeSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (gradeData.nilai === '' || gradeData.nilai === null) {
      newErrors.nilai = 'Nilai wajib diisi'
    } else if (parseFloat(gradeData.nilai) < 0 || parseFloat(gradeData.nilai) > 100) {
      newErrors.nilai = 'Nilai harus antara 0-100'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setGradeErrors(newErrors)
      return
    }

    setGradeLoading(true)
    const submitData = {
      nilai: parseFloat(gradeData.nilai),
      catatan_guru: gradeData.catatan_guru || null
    }

    const { error } = await tugasSiswaService.nilai(id, submitData)
    if (!error) {
      showSuccess('Nilai berhasil disimpan!')
      setShowGradeForm(false)
      fetchTugasSiswa()
    } else {
      console.error(error)
      if (error.errors) {
        setGradeErrors(error.errors)
      } else {
        showError('Gagal menyimpan nilai')
      }
    }
    setGradeLoading(false)
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

  if (loading || !tugasSiswa) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const hasFile = hasAttachment(tugasSiswa)
  const filePath = getAttachmentPath(tugasSiswa)
  const fileUrl = tugasSiswa?.file_url
  const fileName = getFileName(filePath || fileUrl)
  const isImage = isImageFile(fileUrl || filePath)
  const isPdf = isPdfFile(fileUrl || filePath)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/tugas-siswa')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Tugas Siswa</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="tugas-siswa.nilai">
            <Button variant="primary" onClick={() => setShowGradeForm(!showGradeForm)}>
              <Star size={18} className="mr-2" />
              {showGradeForm ? 'Tutup Penilaian' : 'Beri Nilai'}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="tugas-siswa.update">
            <Button variant="warning" onClick={() => navigate(`/akademik/tugas-siswa/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="tugas-siswa.delete">
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
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {tugasSiswa.siswa?.nama || tugasSiswa.siswa?.name || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {tugasSiswa.siswa?.nis ? `NIS: ${tugasSiswa.siswa.nis}` : ''}
              </p>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(tugasSiswa.status_label ?? tugasSiswa.status_kumpul_label ?? tugasSiswa.status_kumpl_label ?? tugasSiswa.status ?? tugasSiswa.status_kumpul ?? tugasSiswa.status_kumpl)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tugasSiswa.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nilai</span>
                  <span className="font-medium text-gray-900 dark:text-white text-lg">
                    {isSubmissionGraded(tugasSiswa) ? getSubmissionScore(tugasSiswa) : 'Menunggu Koreksi'}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tugas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tugasSiswa.tugas?.judul || '-'}
                    </p>
                    {tugasSiswa.tugas?.guru_mapel && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tugasSiswa.tugas.guru_mapel.guru?.nama || ''} - {tugasSiswa.tugas.guru_mapel.mapel?.nama || ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tugasSiswa.siswa?.nama || tugasSiswa.siswa?.name || '-'}
                    </p>
                    {tugasSiswa.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        NIS: {tugasSiswa.siswa.nis}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Kumpul</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(tugasSiswa.waktu_kumpul || tugasSiswa.waktu_kumpl)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status Kumpul</p>
                    <div className="mt-1">{getStatusBadge(tugasSiswa.status_label ?? tugasSiswa.status_kumpul_label ?? tugasSiswa.status_kumpl_label ?? tugasSiswa.status ?? tugasSiswa.status_kumpul ?? tugasSiswa.status_kumpl)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nilai</p>
                    <p className="font-medium text-gray-900 dark:text-white text-lg">
                      {isSubmissionGraded(tugasSiswa) ? getSubmissionScore(tugasSiswa) : 'Menunggu Koreksi'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">File Tugas</p>
                    {hasFile ? (
                      <button
                        type="button"
                        onClick={() => openAttachment(filePath, fileUrl)}
                        className="inline-flex items-center gap-1.5 mt-0.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline text-left"
                        title="Buka / Unduh File Tugas"
                      >
                        <Download size={14} className="shrink-0" />
                        <span className="truncate max-w-[150px]">{fileName}</span>
                      </button>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Berkas / File Upload Section */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck size={18} className="text-primary-600 dark:text-primary-400" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Berkas Hasil Upload Tugas Siswa
                    </h4>
                  </div>
                  {hasFile && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewModalOpen(true)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Eye size={15} />
                        Pratinjau Berkas
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAttachment(filePath, fileUrl)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Download size={15} />
                        Buka / Unduh Berkas
                      </Button>
                    </div>
                  )}
                </div>

                {hasFile ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isImage ? 'Berkas Gambar (Klik gambar atau tombol untuk membuka)' : isPdf ? 'Dokumen PDF' : 'Berkas Tugas Siswa'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAttachment(filePath, fileUrl)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                      >
                        <span>Lihat Ukuran Penuh</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>

                    {isImage && (
                      <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-96 flex items-center justify-center bg-white dark:bg-gray-900 p-2">
                        <img
                          src={fileUrl || filePath}
                          alt="Pratinjau Tugas Siswa"
                          className="max-h-96 w-auto object-contain rounded cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => openAttachment(filePath, fileUrl)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center text-sm text-gray-400 italic border border-dashed border-gray-200 dark:border-gray-700">
                    Siswa belum/tidak melampirkan berkas file pada tugas ini
                  </div>
                )}
              </div>

              {/* Jawaban Section */}
              {(tugasSiswa.jawaban_teks || tugasSiswa.jawaban) && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Jawaban</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tugasSiswa.jawaban_teks || tugasSiswa.jawaban}</p>
                  </div>
                </div>
              )}

              {/* Catatan Section */}
              {(tugasSiswa.catatan_guru || tugasSiswa.catatan) && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Catatan Guru</h4>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tugasSiswa.catatan_guru || tugasSiswa.catatan}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(tugasSiswa.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(tugasSiswa.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Inline Grade Form */}
      {showGradeForm && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Star size={20} className="inline mr-2 text-yellow-500" />
              Penilaian Tugas
            </h3>
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nilai (0-100) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="nilai"
                    value={gradeData.nilai}
                    onChange={(e) => {
                      setGradeData(prev => ({ ...prev, nilai: e.target.value }))
                      if (gradeErrors.nilai) setGradeErrors(prev => ({ ...prev, nilai: null }))
                    }}
                    placeholder="Masukkan nilai"
                    min="0"
                    max="100"
                    error={gradeErrors.nilai}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catatan
                  </label>
                  <textarea
                    name="catatan_guru"
                    value={gradeData.catatan_guru}
                    onChange={(e) => setGradeData(prev => ({ ...prev, catatan_guru: e.target.value }))}
                    placeholder="Catatan untuk siswa (opsional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={() => setShowGradeForm(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={gradeLoading}>
                  <Save size={18} className="mr-2" />
                  {gradeLoading ? 'Menyimpan...' : 'Simpan Nilai'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      <TugasFilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        filePath={filePath}
        fileUrl={fileUrl}
        title={`Tugas: ${tugasSiswa.siswa?.nama || tugasSiswa.siswa?.name || 'Siswa'}`}
        subtitle={fileName}
      />
    </div>
  )
}

export default TugasSiswaDetail