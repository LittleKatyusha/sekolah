import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, School, Hash, CheckCircle, XCircle, ShieldCheck, FileText, UserCheck, ExternalLink, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import RecordHistory from '../../activity-logs/components/RecordHistory'
import { pendaftarService, dokumenService } from '../services/ppdbService'
import { kelasService } from '../../kelas/services/kelasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const STATUS_MAP = {
  draft: { label: 'Draft', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  submitted: { label: 'Diajukan', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  needs_revision: { label: 'Perlu Revisi', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  terverifikasi: { label: 'Terverifikasi', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  seleksi: { label: 'Seleksi', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  diterima: { label: 'Diterima', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cadangan: { label: 'Cadangan', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  enrolled: { label: 'Terdaftar', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
}

const PendaftarDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pendaftar, setPendaftar] = useState(null)
  const [dokumens, setDokumens] = useState([])
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ mst_kelas_id: '', nis: '', nisn: '', tanggal_masuk: '' })
  const [kelasList, setKelasList] = useState([])
  const [loadingKelas, setLoadingKelas] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

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
      navigate('/ppdb/pendaftaran')
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
        navigate('/ppdb/pendaftaran')
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
    const reason = window.prompt('Alasan penolakan wajib diisi:')?.trim()
    if (!reason) return
    const { error } = await pendaftarService.reject(pendaftar.id, reason)
    if (!error) {
      showSuccess('Pendaftar berhasil ditolak!')
      fetchPendaftar()
    } else {
      showError('Gagal menolak pendaftar')
    }
  }

  const handleOpenEnrollModal = async () => {
    setEnrollForm({
      mst_kelas_id: '',
      nis: pendaftar?.nisn || '',
      nisn: pendaftar?.nisn || '',
      tanggal_masuk: new Date().toISOString().split('T')[0],
    })
    setShowEnrollModal(true)
    if (kelasList.length === 0) {
      setLoadingKelas(true)
      const res = await kelasService.getAll({ per_page: 100 })
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : []
      setKelasList(list)
      setLoadingKelas(false)
    }
  }

  const handleEnrollSubmit = async (e) => {
    e.preventDefault()
    if (!enrollForm.mst_kelas_id || !enrollForm.nis?.trim()) {
      showError('Kelas dan NIS wajib diisi')
      return
    }
    setEnrolling(true)
    const payload = {
      mst_kelas_id: Number(enrollForm.mst_kelas_id),
      kelas_id: Number(enrollForm.mst_kelas_id),
      nis: enrollForm.nis.trim(),
    }
    if (enrollForm.nisn?.trim()) {
      payload.nisn = enrollForm.nisn.trim()
    }
    if (enrollForm.tanggal_masuk) {
      payload.tanggal_masuk = enrollForm.tanggal_masuk
    }

    const { data, error } = await pendaftarService.enroll(pendaftar.id, payload)
    setEnrolling(false)
    if (data && !error) {
      showSuccess('Calon siswa berhasil di-enroll ke master siswa!')
      setShowEnrollModal(false)
      fetchPendaftar()
    } else {
      showError(error?.response?.data?.message || error?.message || 'Gagal mendaftarkan siswa')
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

  const status = pendaftar?.status_pendaftaran

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
          <Button variant="secondary" onClick={() => navigate('/ppdb/pendaftaran')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Pendaftar</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {status === 'submitted' && <PermissionGuard permission="ppdb.pendaftaran.verify">
            <Button variant="secondary" onClick={handleVerify}>
              <ShieldCheck size={18} className="mr-2" />
              Verifikasi
            </Button>
          </PermissionGuard>}
          {['terverifikasi', 'seleksi', 'cadangan'].includes(status) && <PermissionGuard permission="ppdb.pendaftaran.accept">
            <Button variant="primary" onClick={handleAccept}>
              <CheckCircle size={18} className="mr-2" />
              Terima
            </Button>
          </PermissionGuard>}
          {['terverifikasi', 'seleksi', 'cadangan'].includes(status) && <PermissionGuard permission="ppdb.pendaftaran.reject">
            <Button variant="danger" onClick={handleReject}>
              <XCircle size={18} className="mr-2" />
              Tolak
            </Button>
          </PermissionGuard>}
          {status === 'diterima' && (
            <PermissionGuard permissions={['ppdb.pendaftaran.enroll', 'ppdb.pendaftaran.accept']}>
              <Button variant="primary" onClick={handleOpenEnrollModal}>
                <UserCheck size={18} className="mr-2" />
                Daftar Ulang (Enroll Siswa)
              </Button>
            </PermissionGuard>
          )}
          <PermissionGuard permission="ppdb.pendaftaran.update">
            <Button variant="warning" onClick={() => navigate(`/ppdb/pendaftaran/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="ppdb.pendaftaran.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
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
                  <span className="font-medium text-gray-900 dark:text-white">{pendaftar.jenis_kelamin_label ?? '-'}</span>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dokumens.map((dok) => (
                    <tr key={dok.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{dok.jenis_dokumen || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400 shrink-0" />
                          {dok.file_url ? (
                            <a
                              href={dok.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>{dok.file_name || 'Lihat Dokumen'}</span>
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <span>{dok.file_name || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${dok.verifikasi_status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {dok.verifikasi_status ? 'Terverifikasi' : 'Belum'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{dok.catatan_admin || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {dok.file_url && (
                          <a
                            href={dok.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium hover:underline"
                          >
                            <ExternalLink size={14} />
                            Buka File
                          </a>
                        )}
                      </td>
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

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat Perubahan</h3>
          <RecordHistory table="ppdb_pendaftar" recordId={id} />
        </div>
      </Card>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 id="enroll-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Daftar Ulang Siswa Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="mst_kelas_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kelas Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  id="mst_kelas_id"
                  name="mst_kelas_id"
                  value={enrollForm.mst_kelas_id}
                  onChange={(e) => setEnrollForm((prev) => ({ ...prev, mst_kelas_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={loadingKelas}
                >
                  <option value="">{loadingKelas ? 'Memuat daftar kelas...' : '-- Pilih Kelas --'}</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas || k.nama || `Kelas ${k.id}`} {k.tingkat ? `(Tingkat ${k.tingkat})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="nis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nomor Induk Siswa (NIS) <span className="text-red-500">*</span>
                </label>
                <input
                  id="nis"
                  name="nis"
                  type="text"
                  value={enrollForm.nis}
                  onChange={(e) => setEnrollForm((prev) => ({ ...prev, nis: e.target.value }))}
                  placeholder="Contoh: 20260001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="nisn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NISN
                </label>
                <input
                  id="nisn"
                  name="nisn"
                  type="text"
                  value={enrollForm.nisn || ''}
                  onChange={(e) => setEnrollForm((prev) => ({ ...prev, nisn: e.target.value }))}
                  placeholder="Nomor Induk Siswa Nasional"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="tanggal_masuk" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Masuk
                </label>
                <input
                  id="tanggal_masuk"
                  name="tanggal_masuk"
                  type="date"
                  value={enrollForm.tanggal_masuk}
                  onChange={(e) => setEnrollForm((prev) => ({ ...prev, tanggal_masuk: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEnrollModal(false)}
                  disabled={enrolling}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={enrolling || !enrollForm.mst_kelas_id || !enrollForm.nis?.trim()}
                >
                  {enrolling ? 'Mendaftarkan...' : 'Konfirmasi Enroll'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendaftarDetail
