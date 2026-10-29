import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import ServerGrid from '../components/ui/ServerGrid'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ActionsMenu from '../components/ui/ActionsMenu'
import PermissionGuard from '../components/guards/PermissionGuard'
import { apiService } from '../utils/api'
import { showDeleteConfirm, showSuccess, showError } from '../utils/sweetalert'

const KATEGORI_OPTIONS = [
  { value: 'seragam', label: 'Seragam', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'ppdb', label: 'PPDB', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'gedung', label: 'Uang Gedung / Sarpras', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'kegiatan', label: 'Kegiatan / Field Trip', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'lainnya', label: 'Lain-Lain', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
]

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(val) || 0)

const JenisPembayaran = () => {
  const gridApiRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kategori: 'kegiatan',
    tipe: 'tetap',
    nominal: 0,
    tahun_ajaran_id: '',
    keterangan: '',
    is_active: true,
  })

  useEffect(() => {
    let active = true
    apiService.get('/admin/tahun-ajaran?per_page=100').then(({ data }) => {
      if (active && data?.data) {
        setTahunAjaranList(Array.isArray(data.data) ? data.data : (data.data.data || []))
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const handleRefresh = useCallback(() => {
    gridApiRef.current?.refreshServerSide({ purge: true })
  }, [])

  const openCreateModal = useCallback(() => {
    setEditItem(null)
    setFormData({
      kode: '',
      nama: '',
      kategori: 'kegiatan',
      tipe: 'tetap',
      nominal: 0,
      tahun_ajaran_id: '',
      keterangan: '',
      is_active: true,
    })
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((item) => {
    setEditItem(item)
    setFormData({
      kode: item.kode || '',
      nama: item.nama || '',
      kategori: item.kategori || 'lainnya',
      tipe: item.tipe || 'tetap',
      nominal: item.nominal || 0,
      tahun_ajaran_id: item.tahun_ajaran_id || '',
      keterangan: item.keterangan || '',
      is_active: Boolean(item.is_active),
    })
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (item) => {
    const result = await showDeleteConfirm(item.nama)
    if (!result.isConfirmed) return

    try {
      const { error } = await apiService.delete(`/keuangan/jenis-pembayaran/${item.id}`)
      if (error) {
        showError(error.message || 'Gagal menghapus jenis pembayaran')
      } else {
        showSuccess('Jenis pembayaran berhasil dihapus!')
        handleRefresh()
      }
    } catch (err) {
      showError(err.message || 'Terjadi kesalahan sistem')
    }
  }, [handleRefresh])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nama.trim()) {
      showError('Nama jenis pembayaran wajib diisi')
      return
    }

    setSaving(true)
    const payload = {
      ...formData,
      nominal: Number(formData.nominal) || 0,
      tahun_ajaran_id: formData.tahun_ajaran_id ? Number(formData.tahun_ajaran_id) : null,
      kode: formData.kode?.trim() || undefined,
    }

    try {
      const res = editItem
        ? await apiService.put(`/keuangan/jenis-pembayaran/${editItem.id}`, payload)
        : await apiService.post('/keuangan/jenis-pembayaran', payload)

      if (res.error) {
        showError(res.error.message || 'Gagal menyimpan jenis pembayaran')
      } else {
        showSuccess(`Jenis pembayaran berhasil ${editItem ? 'diperbarui' : 'ditambahkan'}!`)
        setModalOpen(false)
        handleRefresh()
      }
    } catch (err) {
      showError(err.message || 'Terjadi kesalahan server')
    } finally {
      setSaving(false)
    }
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      sortable: false,
      filter: false,
    },
    {
      field: 'kode',
      headerName: 'Kode',
      width: 140,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'nama',
      headerName: 'Nama Jenis Pembayaran',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'kategori',
      headerName: 'Kategori',
      width: 150,
      sortable: true,
      filter: 'agSetColumnFilter',
      cellRenderer: (params) => {
        const option = KATEGORI_OPTIONS.find((k) => k.value === params.value)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option?.badge || 'bg-gray-100 text-gray-800'}`}>
            {option?.label || params.value || '-'}
          </span>
        )
      },
    },
    {
      field: 'tipe',
      headerName: 'Tipe',
      width: 110,
      sortable: true,
      filter: false,
      cellRenderer: (params) => {
        const isTetap = params.value === 'tetap'
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isTetap ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {isTetap ? 'Tetap' : 'Bebas'}
          </span>
        )
      },
    },
    {
      field: 'nominal',
      headerName: 'Nominal Tarif',
      width: 150,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params) => (
        <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
          {formatRupiah(params.value)}
        </span>
      ),
    },
    {
      field: 'tahun_ajaran',
      headerName: 'Tahun Ajaran',
      width: 140,
      sortable: false,
      filter: false,
      valueGetter: (params) => params.data?.tahun_ajaran?.nama || '-',
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
      sortable: true,
      filter: false,
      cellRenderer: (params) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${params.value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'}`}>
          {params.value ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            data={params.data}
            onEdit={() => openEditModal(params.data)}
            onDelete={() => handleDelete(params.data)}
            editPermission="jenis-pembayaran.update"
            deletePermission="jenis-pembayaran.delete"
          />
        </div>
      ),
    },
  ], [openEditModal, handleDelete])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jenis Pembayaran</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Master klasifikasi iuran non-SPP (seragam, uang gedung, PPDB, kegiatan)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Muat ulang tabel">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="jenis-pembayaran.create">
            <Button onClick={openCreateModal}>
              <Plus size={18} className="mr-2" />
              Tambah Jenis
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <ServerGrid
          endpoint="/keuangan/jenis-pembayaran"
          columnDefs={columnDefs}
          onGridReady={(params) => {
            gridApiRef.current = params.api
          }}
          height={600}
        />
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editItem ? 'Edit Jenis Pembayaran' : 'Tambah Jenis Pembayaran'}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Kode (Opsional)"
                placeholder="Contoh: SRG-2026 (kosongkan untuk auto-generate)"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              />

              <Input
                label="Nama Jenis Pembayaran *"
                placeholder="Contoh: Seragam Olahraga & Batik"
                value={formData.nama}
                required
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori *
                  </label>
                  <select
                    className="input-field"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipe Pembayaran *
                  </label>
                  <select
                    className="input-field"
                    value={formData.tipe}
                    onChange={(e) => {
                      const tipe = e.target.value
                      setFormData({
                        ...formData,
                        tipe,
                        nominal: tipe === 'bebas' ? 0 : formData.nominal,
                      })
                    }}
                  >
                    <option value="tetap">Tetap (Nominal Pasti)</option>
                    <option value="bebas">Bebas (Nominal Fleksibel)</option>
                  </select>
                </div>
              </div>

              <Input
                label={`Nominal Tarif (Rp) ${formData.tipe === 'tetap' ? '*' : '(Bebas/0)'}`}
                type="number"
                min="0"
                step="1000"
                disabled={formData.tipe === 'bebas'}
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tahun Ajaran (Opsional)
                </label>
                <select
                  className="input-field"
                  value={formData.tahun_ajaran_id}
                  onChange={(e) => setFormData({ ...formData, tahun_ajaran_id: e.target.value })}
                >
                  <option value="">Semua / Berlaku Umum</option>
                  {tahunAjaranList.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.nama || ta.tahun_ajaran || `Tahun Ajaran #${ta.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keterangan / Catatan
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Catatan tambahan alokasi dana..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_checkbox" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                  Status Aktif (dapat digunakan untuk transaksi pembayaran)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" loading={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JenisPembayaran


