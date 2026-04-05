import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Clock, BookOpen, User, MapPin } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Day mapping for display
const HARI_MAP = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
  SAT: 'Sabtu',
  SUN: 'Minggu'
}

const JadwalPelajaranDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [jadwal, setJadwal] = useState(null)

  useEffect(() => {
    fetchJadwal()
  }, [id])

  const fetchJadwal = async () => {
    setLoading(true)
    const { data, error } = await jadwalPelajaranService.getById(id)
    if (data) {
      setJadwal(data.data)
    } else {
      showError('Gagal mengambil data jadwal pelajaran')
      navigate('/jadwal-pelajaran')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Jadwal ${jadwal.kelas?.nama_kelas || ''} - ${HARI_MAP[jadwal.hari] || jadwal.hari}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await jadwalPelajaranService.delete(jadwal.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/jadwal-pelajaran')
      } else {
        showError('Gagal menghapus jadwal pelajaran')
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

  if (loading || !jadwal) {
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
          <Button variant="secondary" onClick={() => navigate('/jadwal-pelajaran')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Jadwal Pelajaran</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="jadwal-pelajaran.edit">
            <Button variant="warning" onClick={() => navigate(`/jadwal-pelajaran/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="jadwal-pelajaran.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Schedule Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar size={48} className="text-gray-400" />
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {HARI_MAP[jadwal.hari] || jadwal.hari || '-'}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {jadwal.jam_mulai || '--:--'} - {jadwal.jam_selesai || '--:--'}
              </p>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{jadwal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Kelas</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {jadwal.kelas?.nama_kelas || '-'}
                  </span>
                </div>
                {jadwal.kelas?.tingkat && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tingkat</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {jadwal.kelas.tingkat}
                    </span>
                  </div>
                )}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">{jadwal.kelas?.nama_kelas || '-'}</p>
                    {jadwal.kelas?.tingkat && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tingkat: {jadwal.kelas.tingkat}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hari</p>
                    <p className="font-medium text-gray-900 dark:text-white">{HARI_MAP[jadwal.hari] || jadwal.hari || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jam Mulai - Jam Selesai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {jadwal.jam_mulai || '--:--'} - {jadwal.jam_selesai || '--:--'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {jadwal.guru_mapel?.mapel?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {jadwal.guru_mapel?.guru?.nama || '-'}
                    </p>
                    {jadwal.guru_mapel?.guru?.nip && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIP: {jadwal.guru_mapel.guru.nip}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ruangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{jadwal.ruangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(jadwal.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(jadwal.updated_at)}</p>
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

export default JadwalPelajaranDetail