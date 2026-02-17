import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Calendar, BookOpen, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const SiswaDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [siswa, setSiswa] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [absensiSummary, setAbsensiSummary] = useState(null)

  useEffect(() => {
    fetchSiswa()
  }, [id])

  const fetchSiswa = async () => {
    setLoading(true)
    const { data, error } = await siswaService.getById(id)
    if (data) {
      setSiswa(data.data)
      fetchAbsensiSummary()
    } else {
      showError('Gagal mengambil data siswa')
      navigate('/siswa')
    }
    setLoading(false)
  }

  const fetchAbsensiSummary = async () => {
    const { data } = await siswaService.getAbsensiSummary(id)
    if (data) {
      setAbsensiSummary(data.data)
    }
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm(siswa.nama)
    if (result.isConfirmed) {
      const { error } = await siswaService.delete(siswa.id)
      if (!error) {
        showSuccess(`${siswa.nama} berhasil dihapus!`)
        navigate('/siswa')
      } else {
        showError('Gagal menghapus siswa')
      }
    }
  }

  if (loading || !siswa) {
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
          <Button variant="secondary" onClick={() => navigate('/siswa')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Siswa</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/siswa/${id}/edit`)}>
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
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{siswa.nama}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{siswa.nis} / {siswa.nisn}</p>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                {siswa.status_siswa}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Kelas</span>
                  <span className="font-medium text-gray-900 dark:text-white">{siswa.kelas?.nama_kelas || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gender</span>
                  <span className="font-medium text-gray-900 dark:text-white">{siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">TTL</span>
                  <span className="font-medium text-gray-900 dark:text-white">{siswa.tempat_lahir}, {siswa.tanggal_lahir}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Tabs */}
        <div className="md:col-span-2">
          <Card>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User size={16} className="inline mr-2" />
                  Profil Lengkap
                </button>
                <button
                  onClick={() => setActiveTab('absensi')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'absensi'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Clock size={16} className="inline mr-2" />
                  Absensi
                </button>
                <button
                  onClick={() => setActiveTab('akademik')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'akademik'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BookOpen size={16} className="inline mr-2" />
                  Riwayat Akademik
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Informasi Pribadi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400">Alamat</label>
                        <p className="text-gray-900 dark:text-white">{siswa.alamat || '-'}</p>
                      </div>
                      {/* Add more fields as needed */}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'absensi' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ringkasan Absensi</h3>
                  {absensiSummary ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-green-600 dark:text-green-400">{absensiSummary.hadir || 0}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Hadir</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{absensiSummary.sakit || 0}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Sakit</span>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-yellow-600 dark:text-yellow-400">{absensiSummary.izin || 0}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Izin</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-red-600 dark:text-red-400">{absensiSummary.alpa || 0}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Alpa</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Belum ada data absensi</p>
                  )}
                </div>
              )}

              {activeTab === 'akademik' && (
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Riwayat akademik belum tersedia</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SiswaDetail