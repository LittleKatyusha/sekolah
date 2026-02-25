import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, Calendar, BookOpen, Shield } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { waliService } from '../services/waliService'
import { showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const WaliDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  usePageTitle('Detail Wali')

  const [loading, setLoading] = useState(false)
  const [wali, setWali] = useState(null)

  useEffect(() => {
    fetchWali()
  }, [id])

  const fetchWali = async () => {
    setLoading(true)
    const { data } = await waliService.getWaliById(id)
    if (data) {
      setWali(data.data)
    } else {
      showError('Gagal mengambil data wali')
      navigate('/wali')
    }
    setLoading(false)
  }

  const getJenisKelaminLabel = (value) => {
    if (!value) return '-'
    const jkMap = {
      1: 'Laki-Laki',
      2: 'Perempuan',
    }
    return jkMap[value] || value
  }

  const getPendidikanLabel = (value) => {
    if (!value) return '-'
    const pendidikanMap = {
      1: 'SD',
      2: 'SMP',
      3: 'SMA',
      4: 'D1',
      5: 'D2',
      6: 'D3',
      7: 'D4',
      8: 'S1',
      9: 'S2',
      10: 'S3',
    }
    return pendidikanMap[value] || value
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

  if (loading || !wali) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/wali')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Wali</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{wali.nama}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">NIK: {wali.nik}</p>

              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                (wali.jenis_kelamin === 'Laki-Laki' || wali.jenis_kelamin === 'Laki-laki' || wali.jenis_kelamin === 1)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
              }`}>
                {getJenisKelaminLabel(wali.jenis_kelamin)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pendidikan</span>
                  <span className="font-medium text-gray-900 dark:text-white">{getPendidikanLabel(wali.pendidikan_terakhir)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal Lahir</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(wali.tanggal_lahir)}</span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIK</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.nik || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No. HP</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.no_hp || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Lahir</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(wali.tanggal_lahir)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pekerjaan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.pekerjaan || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pendidikan Terakhir</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getPendidikanLabel(wali.pendidikan_terakhir)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Agama</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.agama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wali.alamat || '-'}</p>
                  </div>
                </div>
              </div>

              {/* User Account Info */}
              {wali.user && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Akun Pengguna</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wali.user.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email Akun</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wali.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(wali.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(wali.updated_at)}</p>
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

export default WaliDetail