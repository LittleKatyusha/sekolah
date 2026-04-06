import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, BookOpen, Award, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { nilaiService } from '../services/nilaiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const NilaiDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [nilai, setNilai] = useState(null)

  useEffect(() => {
    fetchNilai()
  }, [id])

  const fetchNilai = async () => {
    setLoading(true)
    const { data, error } = await nilaiService.getById(id)
    if (data) {
      setNilai(data.data)
    } else {
      showError('Gagal mengambil data nilai')
      navigate('/akademik/nilai')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Nilai ${nilai.siswa?.nama || ''} - ${nilai.ujian?.nama || ''}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await nilaiService.delete(nilai.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/nilai')
      } else {
        showError('Gagal menghapus nilai')
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

  const getNilaiColor = (val) => {
    if (val === null || val === undefined) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    const numVal = parseFloat(val)
    if (numVal >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (numVal >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (numVal >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const getNilaiLabel = (val) => {
    if (val === null || val === undefined) return '-'
    const numVal = parseFloat(val)
    if (numVal >= 80) return 'Sangat Baik'
    if (numVal >= 60) return 'Baik'
    if (numVal >= 40) return 'Cukup'
    return 'Kurang'
  }

  if (loading || !nilai) {
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
          <Button variant="secondary" onClick={() => navigate('/akademik/nilai')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Nilai</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="nilai.edit">
            <Button variant="warning" onClick={() => navigate(`/akademik/nilai/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="nilai.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award size={48} className="text-gray-400" />
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold mb-2 ${getNilaiColor(nilai.nilai)}`}>
                {nilai.nilai !== null && nilai.nilai !== undefined ? parseFloat(nilai.nilai).toFixed(2) : '-'}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{getNilaiLabel(nilai.nilai)}</p>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{nilai.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNilaiColor(nilai.nilai)}`}>
                    {getNilaiLabel(nilai.nilai)}
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
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nilai.siswa?.nama || '-'}</p>
                    {nilai.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {nilai.siswa.nis}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nilai.ujian?.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nilai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {nilai.nilai !== null && nilai.nilai !== undefined ? parseFloat(nilai.nilai).toFixed(2) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{nilai.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Ujian Info */}
              {nilai.ujian && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Informasi Ujian</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nilai.ujian.mapel && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {nilai.ujian.mapel.nama || '-'}
                          {nilai.ujian.mapel.kode && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({nilai.ujian.mapel.kode})</span>
                          )}
                        </p>
                      </div>
                    )}
                    {nilai.ujian.kelas && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                        <p className="font-medium text-gray-900 dark:text-white">{nilai.ujian.kelas.nama_kelas || '-'}</p>
                      </div>
                    )}
                    {nilai.ujian.jenis && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Ujian</p>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {nilai.ujian.jenis}
                        </span>
                      </div>
                    )}
                    {nilai.ujian.semester && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {nilai.ujian.semester}
                        </span>
                      </div>
                    )}
                    {nilai.ujian.tanggal && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Ujian</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(nilai.ujian.tanggal)}</p>
                      </div>
                    )}
                    {nilai.ujian.tahun_ajaran && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                        <p className="font-medium text-gray-900 dark:text-white">{nilai.ujian.tahun_ajaran}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(nilai.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(nilai.updated_at)}</p>
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

export default NilaiDetail