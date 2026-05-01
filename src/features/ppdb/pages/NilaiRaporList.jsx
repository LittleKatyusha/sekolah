import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, MoreVertical, Edit, Trash2, RefreshCw, BookOpen, Upload } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { nilaiRaporService, pendaftarService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

// ── Actions Menu ─────────────────────────────────────────────────────────────
const ActionsMenu = ({ data, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 120 })
    }
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <>
      <button ref={btnRef} onClick={handleToggle} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
        <MoreVertical size={16} />
      </button>
      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
        >
          <PermissionGuard permission="ppdb.pendaftaran.update">
            <button
              onClick={() => { onEdit(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit size={14} /> Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="ppdb.pendaftaran.update">
            <button
              onClick={() => { onDelete(data); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </PermissionGuard>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const NilaiRaporList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendaftaranId = searchParams.get('pendaftaran_id')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [statistik, setStatistik] = useState(null)
  const [pendaftar, setPendaftar] = useState(null)

  const fetchData = useCallback(async () => {
    if (!pendaftaranId) {
      setItems([])
      return
    }
    setLoading(true)
    const { data, error } = await nilaiRaporService.getByPendaftaran(pendaftaranId)
    if (data) {
      setItems(data.data?.nilai_rapor ?? data.data ?? [])
      setStatistik(data.data?.statistik ?? null)
    } else {
      showError('Gagal mengambil data nilai rapor')
    }
    setLoading(false)
  }, [pendaftaranId])

  const fetchPendaftar = useCallback(async () => {
    if (!pendaftaranId) return
    const { data } = await pendaftarService.getById(pendaftaranId)
    if (data) setPendaftar(data.data ?? data)
  }, [pendaftaranId])

  useEffect(() => {
    fetchData()
    fetchPendaftar()
  }, [fetchData, fetchPendaftar])

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm(`Nilai rapor "${item.kode_mapel}"`)
    if (result.isConfirmed) {
      const { error } = await nilaiRaporService.delete(item.id)
      if (!error) {
        showSuccess('Nilai rapor berhasil dihapus')
        fetchData()
      } else {
        showError('Gagal menghapus nilai rapor')
      }
    }
  }

  const handleEdit = (item) => {
    navigate(`/ppdb/nilai-rapor/${item.id}/edit${pendaftaranId ? `?pendaftaran_id=${pendaftaranId}` : ''}`)
  }

  const handleCreate = () => {
    navigate(`/ppdb/nilai-rapor/create${pendaftaranId ? `?pendaftaran_id=${pendaftaranId}` : ''}`)
  }

  const handleBulk = () => {
    navigate(`/ppdb/nilai-rapor/bulk${pendaftaranId ? `?pendaftaran_id=${pendaftaranId}` : ''}`)
  }

  const getNilaiBadge = (nilai) => {
    if (nilai >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (nilai >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (nilai >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={24} /> Nilai Rapor PPDB
          </h1>
          {pendaftar && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pendaftar: <span className="font-medium text-gray-700 dark:text-gray-200">{pendaftar.nama_lengkap}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <PermissionGuard permission="ppdb.pendaftaran.update">
            {pendaftaranId && (
              <Button variant="outline" onClick={handleBulk}>
                <Upload size={16} className="mr-1" /> Input Massal
              </Button>
            )}
            <Button onClick={handleCreate}>
              <Plus size={16} className="mr-1" /> Tambah Nilai
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Statistik */}
      {statistik && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Mapel</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistik.jumlah_mapel ?? items.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</p>
            <p className="text-2xl font-bold text-blue-600">{statistik.rata_rata ?? '-'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Tertinggi</p>
            <p className="text-2xl font-bold text-green-600">{statistik.nilai_tertinggi ?? '-'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Terendah</p>
            <p className="text-2xl font-bold text-red-600">{statistik.nilai_terendah ?? '-'}</p>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw size={24} className="animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada data nilai rapor</p>
            {!pendaftaranId && (
              <p className="text-xs mt-1">Gunakan parameter <code>?pendaftaran_id=</code> untuk filter per pendaftar</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kode Mapel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nilai</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dibuat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.kode_mapel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getNilaiBadge(parseFloat(item.nilai))}`}>
                        {item.nilai}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionsMenu data={item} onEdit={handleEdit} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default NilaiRaporList
