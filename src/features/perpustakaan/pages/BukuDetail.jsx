import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, Hash, User, Building, Calendar, FileText, Layers, Package, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bukuService } from '../services/perpustakaanService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import usePermission from '../../../hooks/usePermission'

const BukuDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  
  usePageTitle('Detail Buku')

  const [loading, setLoading] = useState(false)
  const [buku, setBuku] = useState(null)

  useEffect(() => {
    fetchBuku()
  }, [id])

  const fetchBuku = async () => {
    setLoading(true)
    const { data, error } = await bukuService.getById(id)
    if (data) {
      setBuku(data.data)
    } else {
      showError('Gagal mengambil data buku')
      navigate('/perpustakaan/buku')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm(buku.judul)
    if (result.isConfirmed) {
      const { error } = await bukuService.delete(buku.id)
      if (!error) {
        showSuccess(`${buku.judul} berhasil dihapus!`)
        navigate('/perpustakaan/buku')
      } else {
        showError('Gagal menghapus buku')
      }
    }
  }

  const formatDate = (dateString) => {
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

  if (loading || !buku) {
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
          <Button variant="secondary" onClick={() => navigate('/perpustakaan/buku')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Buku</h1>
          </div>
        </div>
        <div className="flex gap-3">
          {can('buku.update') && (
            <Button variant="warning" onClick={() => navigate(`/perpustakaan/buku/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('buku.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Book Cover / Info Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{buku.judul}</h2>
              {buku.penulis && (
                <p className="text-gray-500 dark:text-gray-400 mb-1">oleh {buku.penulis}</p>
              )}
              {buku.isbn && (
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">ISBN: {buku.isbn}</p>
              )}
              
              {/* Stok Badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                (buku.stok || 0) === 0 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : (buku.stok || 0) < 5
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                Stok: {buku.stok || 0}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                {buku.penerbit && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Penerbit</span>
                    <span className="font-medium text-gray-900 dark:text-white">{buku.penerbit}</span>
                  </div>
                )}
                {buku.tahun && (
                <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tahun</span>
                <span className="font-medium text-gray-900 dark:text-white">{buku.tahun}</span>
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
                {/* ISBN */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ISBN</p>
                    <p className="font-medium text-gray-900 dark:text-white">{buku.isbn || '-'}</p>
                  </div>
                </div>

                {/* Judul */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Judul</p>
                    <p className="font-medium text-gray-900 dark:text-white">{buku.judul || '-'}</p>
                  </div>
                </div>

                {/* Penulis */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Penulis</p>
                    <p className="font-medium text-gray-900 dark:text-white">{buku.penulis || '-'}</p>
                  </div>
                </div>

                {/* Penerbit */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Penerbit</p>
                    <p className="font-medium text-gray-900 dark:text-white">{buku.penerbit || '-'}</p>
                  </div>
                </div>

                {/* Tahun */}
                <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-yellow-600" />
                </div>
                <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tahun</p>
                <p className="font-medium text-gray-900 dark:text-white">{buku.tahun || '-'}</p>
                </div>
                </div>
                {/* Stok */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stok</p>
                    <p className="font-medium text-gray-900 dark:text-white">{buku.stok || 0}</p>
                  </div>
                </div>

              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock size={16} />
                  Informasi Waktu
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(buku.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(buku.updated_at)}</p>
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

export default BukuDetail