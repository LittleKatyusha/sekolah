import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Plus, RefreshCw, X, Printer, CheckCircle } from 'lucide-react'
import ServerGrid from '../components/ui/ServerGrid'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ActionsMenu from '../components/ui/ActionsMenu'
import SearchableSelect from '../components/ui/SearchableSelect'
import PermissionGuard from '../components/guards/PermissionGuard'
import { apiService } from '../utils/api'
import { showDeleteConfirm, showSuccess, showError } from '../utils/sweetalert'

const STATUS_MAP = {
  1: { label: 'Lunas', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  2: { label: 'Belum Lunas', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  3: { label: 'Pending', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  4: { label: 'Batal', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
  5: { label: 'Refund', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
}

const METODE_MAP = {
  1: 'Tunai',
  2: 'Transfer Bank',
  3: 'Virtual Account',
  4: 'QRIS',
}

const TIPE_MAP = {
  siswa: { label: 'Siswa', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  ppdb: { label: 'PPDB', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  umum: { label: 'Umum', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
}

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(val) || 0)

const PembayaranLain = () => {
  const gridApiRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [jenisPembayaranList, setJenisPembayaranList] = useState([])

  const [formData, setFormData] = useState({
    mst_jenis_pembayaran_id: '',
    tipe_pembayar: 'siswa',
    mst_siswa_id: '',
    ppdb_pendaftar_id: '',
    nama_pembayar: '',
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    jumlah_bayar: 0,
    metode_pembayaran: 1,
    status: 1,
    keterangan: '',
  })

  useEffect(() => {
    let active = true
    apiService.get('/keuangan/jenis-pembayaran?per_page=100').then(({ data }) => {
      if (active && data?.data) {
        const list = Array.isArray(data.data) ? data.data : (data.data.data || [])
        setJenisPembayaranList(list)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const handleRefresh = useCallback(() => {
    gridApiRef.current?.refreshServerSide({ purge: true })
  }, [])

  const searchSiswa = useCallback(async (query) => {
    try {
      const { data } = await apiService.get('/siswa', { params: { search: query, per_page: 20 } })
      const rows = data?.data?.data || data?.data || []
      return rows.map((s) => ({
        value: s.id,
        label: `${s.nis ? `${s.nis} - ` : ''}${s.nama || s.user?.name || `Siswa #${s.id}`}`,
      }))
    } catch {
      return []
    }
  }, [])

  const searchPpdb = useCallback(async (query) => {
    try {
      const { data } = await apiService.get('/ppdb/pendaftaran', { params: { search: query, per_page: 20 } })
      const rows = data?.data?.data || data?.data || []
      return rows.map((p) => ({
        value: p.id,
        label: `${p.nomor_pendaftaran ? `${p.nomor_pendaftaran} - ` : ''}${p.nama_lengkap || p.nama || `Pendaftar #${p.id}`}`,
      }))
    } catch {
      return []
    }
  }, [])

  const openCreateModal = useCallback(() => {
    setEditItem(null)
    setFormData({
      mst_jenis_pembayaran_id: jenisPembayaranList[0]?.id || '',
      tipe_pembayar: 'siswa',
      mst_siswa_id: '',
      ppdb_pendaftar_id: '',
      nama_pembayar: '',
      tanggal_bayar: new Date().toISOString().slice(0, 10),
      jumlah_bayar: jenisPembayaranList[0]?.nominal || 0,
      metode_pembayaran: 1,
      status: 1,
      keterangan: '',
    })
    setModalOpen(true)
  }, [jenisPembayaranList])

  const openEditModal = useCallback((item) => {
    setEditItem(item)
    setFormData({
      mst_jenis_pembayaran_id: item.mst_jenis_pembayaran_id || '',
      tipe_pembayar: item.tipe_pembayar || 'siswa',
      mst_siswa_id: item.mst_siswa_id || '',
      ppdb_pendaftar_id: item.ppdb_pendaftar_id || '',
      nama_pembayar: item.nama_pembayar || '',
      tanggal_bayar: item.tanggal_bayar ? item.tanggal_bayar.slice(0, 10) : new Date().toISOString().slice(0, 10),
      jumlah_bayar: item.jumlah_bayar || 0,
      metode_pembayaran: item.metode_pembayaran || 1,
      status: item.status || 1,
      keterangan: item.keterangan || '',
    })
    setModalOpen(true)
  }, [])

  const openDetailModal = useCallback((item) => {
    setSelectedItem(item)
    setDetailModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (item) => {
    const label = `Transaksi ${item.kode_transaksi || `#${item.id}`}`
    const result = await showDeleteConfirm(label)
    if (!result.isConfirmed) return

    try {
      const { error } = await apiService.delete(`/keuangan/pembayaran-lain/${item.id}`)
      if (error) {
        showError(error.message || 'Gagal menghapus transaksi')
      } else {
        showSuccess('Transaksi pembayaran berhasil dihapus!')
        handleRefresh()
      }
    } catch (err) {
      showError(err.message || 'Terjadi kesalahan sistem')
    }
  }, [handleRefresh])

  const handleKonfirmasiBayar = useCallback(async (item) => {
    try {
      const { error } = await apiService.post(`/keuangan/pembayaran-lain/${item.id}/bayar`, {
        metode_pembayaran: item.metode_pembayaran || 1,
        tanggal_bayar: new Date().toISOString().slice(0, 10),
        jumlah_bayar: item.jumlah_bayar,
      })
      if (error) {
        showError(error.message || 'Gagal mengonfirmasi pembayaran')
      } else {
        showSuccess('Pembayaran berhasil dikonfirmasi Lunas!')
        handleRefresh()
      }
    } catch (err) {
      showError(err.message || 'Terjadi kesalahan sistem')
    }
  }, [handleRefresh])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.mst_jenis_pembayaran_id) {
      showError('Pilih jenis pembayaran terlebih dahulu')
      return
    }

    setSaving(true)
    const payload = {
      mst_jenis_pembayaran_id: Number(formData.mst_jenis_pembayaran_id),
      tipe_pembayar: formData.tipe_pembayar,
      mst_siswa_id: formData.tipe_pembayar === 'siswa' && formData.mst_siswa_id ? Number(formData.mst_siswa_id) : null,
      ppdb_pendaftar_id: formData.tipe_pembayar === 'ppdb' && formData.ppdb_pendaftar_id ? Number(formData.ppdb_pendaftar_id) : null,
      nama_pembayar: formData.tipe_pembayar === 'umum' ? formData.nama_pembayar : undefined,
      tanggal_bayar: formData.tanggal_bayar,
      jumlah_bayar: Number(formData.jumlah_bayar) || 0,
      metode_pembayaran: Number(formData.metode_pembayaran) || 1,
      status: Number(formData.status) || 1,
      keterangan: formData.keterangan || undefined,
    }

    try {
      const res = editItem
        ? await apiService.put(`/keuangan/pembayaran-lain/${editItem.id}`, payload)
        : await apiService.post('/keuangan/pembayaran-lain', payload)

      if (res.error) {
        showError(res.error.message || 'Gagal menyimpan transaksi pembayaran')
      } else {
        showSuccess(`Transaksi berhasil ${editItem ? 'diperbarui' : 'dicatat'}!`)
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
      field: 'kode_transaksi',
      headerName: 'Kode Transaksi',
      width: 160,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'tanggal_bayar',
      headerName: 'Tanggal Bayar',
      width: 130,
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? params.value.slice(0, 10) : '-',
    },
    {
      field: 'jenis_pembayaran',
      headerName: 'Jenis Pembayaran',
      width: 170,
      sortable: false,
      filter: false,
      valueGetter: (params) => params.data?.jenis_pembayaran?.nama || '-',
    },
    {
      field: 'tipe_pembayar',
      headerName: 'Tipe',
      width: 100,
      sortable: true,
      filter: false,
      cellRenderer: (params) => {
        const item = TIPE_MAP[params.value] || { label: params.value, badge: 'bg-gray-100 text-gray-800' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${item.badge}`}>
            {item.label}
          </span>
        )
      },
    },
    {
      field: 'nama_pembayar_display',
      headerName: 'Pembayar / Siswa',
      flex: 1,
      minWidth: 180,
      sortable: false,
      filter: 'agTextColumnFilter',
      valueGetter: (params) => params.data?.nama_pembayar_display || params.data?.nama_pembayar || params.data?.siswa?.nama || '-',
    },
    {
      field: 'jumlah_bayar',
      headerName: 'Jumlah Bayar',
      width: 140,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params) => (
        <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
          {formatRupiah(params.value)}
        </span>
      ),
    },
    {
      field: 'metode_pembayaran',
      headerName: 'Metode',
      width: 130,
      sortable: true,
      filter: false,
      cellRenderer: (params) => METODE_MAP[params.value] || 'Lainnya',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      filter: false,
      cellRenderer: (params) => {
        const st = STATUS_MAP[params.value] || { label: 'Unknown', badge: 'bg-gray-100 text-gray-800' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${st.badge}`}>
            {st.label}
          </span>
        )
      },
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const item = params.data
        const extraActions = []
        if (item?.status !== 1) {
          extraActions.push({
            label: 'Konfirmasi Bayar',
            onClick: () => handleKonfirmasiBayar(item),
            permission: 'pembayaran-lain.bayar',
            icon: CheckCircle,
          })
        }
        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              data={item}
              onDetail={() => openDetailModal(item)}
              onEdit={() => openEditModal(item)}
              onDelete={() => handleDelete(item)}
              editPermission="pembayaran-lain.update"
              deletePermission="pembayaran-lain.delete"
              extraActions={extraActions}
            />
          </div>
        )
      },
    },
  ], [openDetailModal, openEditModal, handleDelete, handleKonfirmasiBayar])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pembayaran Lain-Lain</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pencatatan kas dan transaksi iuran non-SPP (seragam, uang gedung, PPDB, kegiatan)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Muat ulang tabel">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="pembayaran-lain.create">
            <Button onClick={openCreateModal}>
              <Plus size={18} className="mr-2" />
              Catat Pembayaran
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <ServerGrid
          endpoint="/keuangan/pembayaran-lain"
          columnDefs={columnDefs}
          onGridReady={(params) => {
            gridApiRef.current = params.api
          }}
          height={600}
        />
      </Card>

      {/* Modal Create & Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editItem ? 'Edit Transaksi Pembayaran' : 'Catat Pembayaran Baru'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jenis Pembayaran *
                </label>
                <select
                  className="input-field"
                  disabled={Boolean(editItem)}
                  value={formData.mst_jenis_pembayaran_id}
                  onChange={(e) => {
                    const id = e.target.value
                    const selected = jenisPembayaranList.find((j) => String(j.id) === String(id))
                    setFormData({
                      ...formData,
                      mst_jenis_pembayaran_id: id,
                      jumlah_bayar: selected?.nominal || formData.jumlah_bayar,
                    })
                  }}
                >
                  <option value="">Pilih Jenis Pembayaran...</option>
                  {jenisPembayaranList.map((jp) => (
                    <option key={jp.id} value={jp.id}>
                      {jp.nama} ({formatRupiah(jp.nominal)})
                    </option>
                  ))}
                </select>
              </div>

              {!editItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipe Pembayar *
                    </label>
                    <select
                      className="input-field"
                      value={formData.tipe_pembayar}
                      onChange={(e) => setFormData({ ...formData, tipe_pembayar: e.target.value })}
                    >
                      <option value="siswa">Siswa Aktif</option>
                      <option value="ppdb">Calon Siswa (PPDB)</option>
                      <option value="umum">Umum / Lainnya</option>
                    </select>
                  </div>

                  {formData.tipe_pembayar === 'siswa' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pilih Siswa *
                      </label>
                      <SearchableSelect
                        placeholder="Ketik nama atau NIS siswa..."
                        loadOptions={searchSiswa}
                        value={formData.mst_siswa_id}
                        onChange={(e) => setFormData({ ...formData, mst_siswa_id: e.target.value })}
                      />
                    </div>
                  )}

                  {formData.tipe_pembayar === 'ppdb' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pilih Calon Siswa (PPDB) *
                      </label>
                      <SearchableSelect
                        placeholder="Ketik nomor pendaftaran atau nama..."
                        loadOptions={searchPpdb}
                        value={formData.ppdb_pendaftar_id}
                        onChange={(e) => setFormData({ ...formData, ppdb_pendaftar_id: e.target.value })}
                      />
                    </div>
                  )}

                  {formData.tipe_pembayar === 'umum' && (
                    <Input
                      label="Nama Pembayar *"
                      placeholder="Contoh: Orang tua alumni / Pihak luar"
                      value={formData.nama_pembayar}
                      required
                      onChange={(e) => setFormData({ ...formData, nama_pembayar: e.target.value })}
                    />
                  )}
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Bayar *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.tanggal_bayar}
                    onChange={(e) => setFormData({ ...formData, tanggal_bayar: e.target.value })}
                  />
                </div>

                <Input
                  label="Jumlah Bayar (Rp) *"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.jumlah_bayar}
                  onChange={(e) => setFormData({ ...formData, jumlah_bayar: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metode Pembayaran *
                  </label>
                  <select
                    className="input-field"
                    value={formData.metode_pembayaran}
                    onChange={(e) => setFormData({ ...formData, metode_pembayaran: Number(e.target.value) })}
                  >
                    <option value={1}>Tunai</option>
                    <option value={2}>Transfer Bank</option>
                    <option value={3}>Virtual Account</option>
                    <option value={4}>QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Transaksi *
                  </label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  >
                    <option value={1}>Lunas</option>
                    <option value={2}>Belum Lunas</option>
                    <option value={3}>Pending</option>
                    {editItem && (
                      <>
                        <option value={4}>Batal</option>
                        <option value={5}>Refund</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan / Keterangan
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Catatan pembayaran..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                />
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
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Detail / Kuitansi */}
      {detailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kuitansi Pembayaran
              </h3>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Kode Transaksi:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedItem.kode_transaksi || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Tanggal:</span>
                <span className="text-gray-900 dark:text-white">{selectedItem.tanggal_bayar?.slice(0, 10) || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Jenis:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedItem.jenis_pembayaran?.nama || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Pembayar:</span>
                <span className="text-gray-900 dark:text-white">{selectedItem.nama_pembayar_display || selectedItem.nama_pembayar || selectedItem.siswa?.nama || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Jumlah Bayar:</span>
                <span className="text-base font-bold text-primary-600 dark:text-primary-400">{formatRupiah(selectedItem.jumlah_bayar)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Metode:</span>
                <span className="text-gray-900 dark:text-white">{METODE_MAP[selectedItem.metode_pembayaran] || 'Lainnya'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_MAP[selectedItem.status]?.badge || 'bg-gray-100 text-gray-800'}`}>
                  {STATUS_MAP[selectedItem.status]?.label || selectedItem.status}
                </span>
              </div>
              {selectedItem.petugas && (
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Petugas:</span>
                  <span className="text-gray-900 dark:text-white">{selectedItem.petugas.name}</span>
                </div>
              )}
              {selectedItem.keterangan && (
                <div className="py-1">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Catatan:</span>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs">{selectedItem.keterangan}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </Button>
              <Button type="button" onClick={() => window.print()}>
                <Printer size={16} className="mr-1.5" />
                Cetak Kuitansi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PembayaranLain





