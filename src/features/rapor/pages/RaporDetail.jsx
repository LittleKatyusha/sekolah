import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User, Calendar, ClipboardList, Hash } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { raporService } from '../services/raporService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const RaporDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [rapor, setRapor] = useState(null)

  useEffect(() => {
    fetchRapor()
  }, [id])

  const fetchRapor = async () => {
    setLoading(true)
    const { data, error } = await raporService.getById(id)
    if (data) {
      setRapor(data.data)
    } else {
      showError('Gagal mengambil data rapor')
      navigate('/akademik/rapor')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const siswaName = rapor.siswa?.nama || ''
    const label = `Rapor "${siswaName}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await raporService.delete(rapor.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/rapor')
      } else {
        showError('Gagal menghapus rapor')
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

  if (loading || !rapor) {
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
          <Button variant="secondary" onClick={() => navigate('/akademik/rapor')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Rapor</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="rapor.edit">
            <Button variant="warning" onClick={() => navigate(`/akademik/rapor/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="rapor.delete">
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
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {rapor.siswa?.nama || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                NIS: {rapor.siswa?.nis || '-'}
              </p>
              <div className="flex justify-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {rapor.semester || '-'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Nilai</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{rapor.total_nilai ?? '-'}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {rapor.rata_rata != null ? parseFloat(rapor.rata_rata).toFixed(2) : '-'}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{rapor.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Kelas</span>
                  <span className="font-medium text-gray-900 dark:text-white">{rapor.kelas || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tahun Ajaran</span>
                  <span className="font-medium text-gray-900 dark:text-white">{rapor.tahun_ajaran || '-'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Rapor</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rapor.siswa?.nama || '-'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {rapor.siswa?.nis || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rapor.kelas || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rapor.semester || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rapor.tahun_ajaran || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Kehadiran */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Kehadiran</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sakit</p>
                    <p className="text-xl font-bold text-yellow-600">{rapor.kehadiran?.sakit ?? 0}</p>
                    <p className="text-xs text-gray-500">hari</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Izin</p>
                    <p className="text-xl font-bold text-blue-600">{rapor.kehadiran?.izin ?? 0}</p>
                    <p className="text-xs text-gray-500">hari</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanpa Keterangan</p>
                    <p className="text-xl font-bold text-red-600">{rapor.kehadiran?.tanpa_keterangan ?? 0}</p>
                    <p className="text-xs text-gray-500">hari</p>
                  </div>
                </div>
              </div>

              {/* Catatan Wali */}
              {rapor.catatan_wali && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Catatan Wali Kelas</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rapor.catatan_wali}</p>
                  </div>
                </div>
              )}

              {/* Detail Nilai */}
              {rapor.detail && rapor.detail.length > 0 && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Detail Nilai per Mata Pelajaran</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">No</th>
                          <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Kode</th>
                          <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Mata Pelajaran</th>
                          <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Pengetahuan</th>
                          <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Keterampilan</th>
                          <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Nilai Akhir</th>
                          <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Predikat</th>
                          <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapor.detail.map((d, index) => (
                          <tr key={d.id || index} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{index + 1}</td>
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                              {d.mapel?.kode || d.mapel?.kode_mapel || '-'}
                            </td>
                            <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                              {d.mapel?.nama || d.mapel?.nama_mapel || '-'}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{d.nilai_pengetahuan ?? '-'}</td>
                            <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{d.nilai_keterampilan ?? '-'}</td>
                            <td className="py-2 px-3 text-center font-semibold text-gray-900 dark:text-white">{d.nilai_akhir ?? '-'}</td>
                            <td className="py-2 px-3 text-center">
                              {d.predikat ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                  {d.predikat}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-xs">{d.deskripsi || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(rapor.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(rapor.updated_at)}</p>
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

export default RaporDetail