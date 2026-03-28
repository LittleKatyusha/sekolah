import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, FileText, Hash, Calendar, BookOpen, GraduationCap, Tag, Clock, Award } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianService } from '../services/ujianService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatJenisLabel, formatSemesterLabel, getMapelCode, getMapelLabel, getUjianName } from '../utils/ujianFormatters'

const UjianDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [ujian, setUjian] = useState(null)

  useEffect(() => {
    fetchUjian()
  }, [id])

  const fetchUjian = async () => {
    setLoading(true)
    const { data, error } = await ujianService.getById(id)
    if (data) {
      setUjian(data.data)
    } else {
      showError('Gagal mengambil data ujian')
      navigate('/akademik/ujian')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm(getUjianName(ujian))
    if (result.isConfirmed) {
      const { error } = await ujianService.delete(ujian.id)
      if (!error) {
        showSuccess(`Ujian berhasil dihapus!`)
        navigate('/akademik/ujian')
      } else {
        showError('Gagal menghapus ujian')
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

  if (loading || !ujian) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/ujian')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Ujian</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="info" onClick={() => navigate(`/akademik/ujian/${id}/nilai`)}>
            <Award size={18} className="mr-2" />
            Lihat Nilai
          </Button>
          <Button variant="warning" onClick={() => navigate(`/akademik/ujian/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Info Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText size={48} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {getUjianName(ujian)}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                {formatJenisLabel(ujian.jenis, { short: true })}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mata Pelajaran</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getMapelLabel(ujian.mapel)}
                  </p>
                  {getMapelCode(ujian.mapel) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kode: {getMapelCode(ujian.mapel)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kelas</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ujian.kelas?.nama_kelas || '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ujian.id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getUjianName(ujian)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatJenisLabel(ujian.jenis)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(ujian.tanggal)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatSemesterLabel(ujian.semester)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ujian.tahun_ajaran || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{ujian.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(ujian.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(ujian.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UjianDetail