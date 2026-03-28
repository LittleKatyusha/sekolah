import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Calendar, BookOpen, Clock, Mail, Phone, MapPin, Heart, Droplets, Ruler, Weight, School, Hash, Users } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const SiswaDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [siswa, setSiswa] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [absensiSummary, setAbsensiSummary] = useState(null)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    const fetchSiswa = async () => {
      setLoading(true)
      const { data, error } = await siswaService.getById(id, { signal: controller.signal })
      if (!mounted) return
      if (data) {
        setSiswa(data.data)
        // Fetch summary in background after main data arrives
        siswaService.getAbsensiSummary(id, { signal: controller.signal }).then(({ data: sd }) => {
          if (mounted && sd) setAbsensiSummary(sd.data)
        })
      } else {
        showError('Gagal mengambil data siswa')
        navigate('/siswa')
      }
      if (mounted) setLoading(false)
    }

    fetchSiswa()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [id, navigate])

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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    const statusLower = status.toLowerCase()
    if (statusLower === 'aktif') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (statusLower === 'lulus') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (statusLower === 'keluar') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    if (statusLower === 'pindah') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
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
          {can('siswa.update') && (
            <Button variant="warning" onClick={() => navigate(`/siswa/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('siswa.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
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
              <p className="text-gray-500 dark:text-gray-400 mb-2">NIS: {siswa.nis}</p>
              {siswa.nisn && (
                <p className="text-gray-500 dark:text-gray-400 mb-4">NISN: {siswa.nisn}</p>
              )}
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(siswa.status)}`}>
                {siswa.status}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Kelas</span>
                  <span className="font-medium text-gray-900 dark:text-white">{siswa.kelas?.nama_kelas || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Jenis Kelamin</span>
                  <span className="font-medium text-gray-900 dark:text-white">{siswa.jenis_kelamin || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">TTL</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {siswa.tempat_lahir ? `${siswa.tempat_lahir}, ` : ''}{formatDate(siswa.tanggal_lahir)}
                  </span>
                </div>
                {siswa.kelas?.tahun_ajaran && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tahun Ajaran</span>
                    <span className="font-medium text-gray-900 dark:text-white">{siswa.kelas.tahun_ajaran}</span>
                  </div>
                )}
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
                <div className="space-y-8">
                  {/* Informasi Pribadi */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Pribadi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.nis || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">NISN</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.nisn || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Hash size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">NIK</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.nik || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar size={20} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Lahir</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {siswa.tempat_lahir ? `${siswa.tempat_lahir}, ` : ''}{formatDate(siswa.tanggal_lahir)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Agama</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.agama || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users size={20} className="text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Anak Ke</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.anak_ke || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kontak */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Kontak</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.email || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">No. HP</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.no_hp || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 md:col-span-2">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin size={20} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.alamat || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Kesehatan */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Kesehatan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Droplets size={20} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Golongan Darah</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.golongan_darah || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Ruler size={20} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tinggi Badan</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {siswa.tinggi_badan ? `${siswa.tinggi_badan} cm` : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Weight size={20} className="text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Berat Badan</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {siswa.berat_badan ? `${siswa.berat_badan} kg` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Sekolah */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Sekolah</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Masuk</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(siswa.tanggal_masuk)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <School size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Asal Sekolah</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.asal_sekolah || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Account Info */}
                  {siswa.user && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Akun Pengguna</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.user.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email Akun</p>
                          <p className="font-medium text-gray-900 dark:text-white">{siswa.user.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status Akun</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            siswa.user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {siswa.user.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                        <p className="text-gray-700 dark:text-gray-300">{formatDate(siswa.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                        <p className="text-gray-700 dark:text-gray-300">{formatDate(siswa.updated_at)}</p>
                      </div>
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