import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, FileText, Activity, Briefcase } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkSesiService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Metode color classes (explicit for Tailwind purge)
const metodeColorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
  gray: 'bg-gray-100 text-gray-700',
}

const getMetodeInfo = (metode) => {
  const metodeMap = {
    1: { label: 'Konseling Individual', color: 'blue' },
    2: { label: 'Konseling Kelompok', color: 'purple' },
    3: { label: 'Mediasi', color: 'orange' },
    4: { label: 'Kunjungan Rumah', color: 'teal' },
  }
  return metodeMap[metode] || { label: metode || '-', color: 'gray' }
}

const getMetodeBadge = (metode) => {
  const m = getMetodeInfo(metode)
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${metodeColorClasses[m.color]}`}>
      {m.label}
    </span>
  )
}

const BkSesiDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [sesi, setSesi] = useState(null)

  useEffect(() => {
    fetchSesi()
  }, [id])

  const fetchSesi = async () => {
    setLoading(true)
    const { data, error } = await bkSesiService.getById(id)
    if (data) {
      setSesi(data.data)
    } else {
      showError('Gagal mengambil data sesi konseling')
      navigate('/bk/sesi')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm('sesi ini')
    if (result.isConfirmed) {
      const { error } = await bkSesiService.delete(sesi.id)
      if (!error) {
        showSuccess('Sesi konseling berhasil dihapus!')
        navigate('/bk/sesi')
      } else {
        showError('Gagal menghapus sesi konseling')
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

  if (loading || !sesi) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/sesi')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Sesi Konseling</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/bk/sesi/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Sesi Konseling</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID Kasus */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID Kasus</p>
                <p className="font-medium text-gray-900 dark:text-white">Kasus #{sesi.trx_bk_kasus_id}</p>
              </div>
            </div>

            {/* Tanggal */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(sesi.tanggal)}</p>
              </div>
            </div>

            {/* Metode */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Metode</p>
                <div className="mt-1">{getMetodeBadge(sesi.metode)}</div>
              </div>
            </div>

            {/* Catatan - full width */}
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Catatan</p>
                <p className="font-medium text-gray-900 dark:text-white">{sesi.catatan || '-'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(sesi.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(sesi.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BkSesiDetail