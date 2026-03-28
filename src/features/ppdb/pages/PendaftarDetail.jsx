import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, School, Hash, CheckCircle, XCircle, ShieldCheck, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { pendaftarService, dokumenService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const STATUS_MAP = {
  draft: { label: 'Draft', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  terverifikasi: { label: 'Terverifikasi', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  seleksi: { label: 'Seleksi', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  diterima: { label: 'Diterima', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cadangan: { label: 'Cadangan', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const GENDER_MAP = { L: 'Laki-laki', P: 'Perempuan' }

const PendaftarDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pendaftar, setPendaftar] = useState(null)
  const [dokumens, setDokumens] = useState([])

  useEffect(() => {
    fetchPendaftar()
  }, [id])

  const fetchPendaftar = async () => {
    setLoading(true)
    const { data, error } = await pendaftarService.getById(id)
    if (data) {
      setPendaftar(data.data)
      // Try to fetch documents for this pendaftar
      const dokRes = await dokumenService.getByPendaftaran(id)
      if (dokRes.data) {
        setDokumens(dokRes.data?.data || dokRes.data || [])
      }
    } else {
      showError('Gagal mengambil data pendaftar')
      navigate('/ppdb/pendaftar')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Pendaftar "${pendaftar.nama_lengkap || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await pendaftarService.delete(pendaftar.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/ppdb/pendaftar')
      } else {
        showError('Gagal menghapus pendaftar')
      }
    }
  }

  const handleVerify = async () => {
    const { error } = await pendaftarService.verify(pendaftar.id)
    if (!error) {
      showSuccess('Pendaftar berhasil diverifikasi!')
      fetchPendaftar()
    } else {
      showError('Gagal memverifikasi pendaftar')
    }
  }

  const handleAccept = async () => {
    const { error } = await pendaftarService.accept(pendaftar.id)
    if (!error) {
      showSuccess('Pendaftar berhasil diterima!')
      fetchPendaftar()
    } else {
      showError('Gagal menerima pendaftar')
    }
  }

  const handleReject = async () => {
    const { error } = await pendaftarService.reject(pendaftar.id)
    if (!error) {
      showSuccess('Pendaftar berhasil ditolak!')
      fetchPendaftar()
    } else {
      showError('Gagal menolak pendaftar')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getStatusBadge = (status) => {
    if (!status) return '-'
    const info = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>{info.label}</span>
  }

  if (loading || !pendaftar) {
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
          <Button variant="secondary" onClick={() => navigate('/ppdb/pendaftar')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Pendaftar</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleVerify}>
            <ShieldCheck size={18} className="mr-2" />
            Verifikasi
          </Button>
          <Button variant="primary" onClick={handleAccept}>
            <CheckCircle size={18} className="mr-2" />
            Terima
          </Button>
          <Button variant="danger" onClick={handleReject}>
            <XCircle size={18} className="mr-2" />
            Tolak
          </Button>
          {can('ppdb.pendaftaran.update') && (
            <Button variant="warning" onClick={() => navigate(`/ppdb/pendaftar/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('ppdb.pendaftaran.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {pendaftar.nama_lengkap || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(pendaftar.status_pendaftaran)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pendaftar.no_pendaftaran || '-'}</p>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{pendaftar.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">JK</span>
                  <span className="font-medium text-gray-900 dark:text-white">{GENDER_MAP[pendaftar.jenis_kelamin] || '-'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Lengkap</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pendaftar.nama_lengkap || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pendaftar.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NISN</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pendaftar.nisn || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No. Telp/HP</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pendaftar.telp_hp || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <School size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Asal Sekolah</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pendaftar.asal_sekolah || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gelombang</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pendaftar.gelombang?.nama_gelombang || pendaftar.ppdb_gelombang_id || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(pendaftar.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(pendaftar.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Documents Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dokumen Pendaftar</h3>
          {Array.isArray(dokumens) && dokumens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jenis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">File</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dokumens.map((dok) => (
                    <tr key={dok.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{dok.jenis_dokumen || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          {dok.file_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${dok.verifikasi_status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {dok.verifikasi_status ? 'Terverifikasi' : 'Belum'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{dok.catatan_admin || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada dokumen yang diunggah.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default PendaftarDetail