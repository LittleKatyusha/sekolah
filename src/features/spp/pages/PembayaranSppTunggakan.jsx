import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, CreditCard, AlertCircle, CheckSquare, Square, Globe } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { pembayaranSppService, tarifSppService } from '../services/sppService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import Swal from 'sweetalert2'

const BULAN_MAP = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const PembayaranSppTunggakan = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Filter state
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [siswaId, setSiswaId] = useState(searchParams.get('siswaId') || '')
  const [tarifSppId, setTarifSppId] = useState('')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [tarifOptions, setTarifOptions] = useState([])

  // Results state
  const [tunggakan, setTunggakan] = useState([])
  const [selectedBulan, setSelectedBulan] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingBayar, setLoadingBayar] = useState(false)
  const [loadingBayarOnline, setLoadingBayarOnline] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Load tarif SPP options on mount
  useEffect(() => {
    const fetchTarif = async () => {
      const { data } = await tarifSppService.getAll({ per_page: 100 })
      if (data?.data) {
        setTarifOptions(
          data.data.map((t) => ({
            value: String(t.id),
            label: `${t.kelas?.nama_kelas || 'Kelas ?'} — Rp ${Number(t.nominal || 0).toLocaleString('id-ID')}`,
          }))
        )
      }
    }
    fetchTarif()
  }, [])

  // Pre-fill siswa option label when siswaId comes from URL query param
  useEffect(() => {
    const prefilledId = searchParams.get('siswaId')
    if (!prefilledId) return
    siswaService.getById(prefilledId).then(({ data }) => {
      const siswa = data?.data
      if (siswa) {
        const option = buildSiswaOption(siswa)
        setSelectedSiswaOption(option)
      }
    })
  }, []) // run once on mount

  // Siswa searchable select helpers
  const buildSiswaOption = useCallback(
    (siswa) => ({
      value: String(siswa.id),
      label: siswa.nis ? `${siswa.nama} (${siswa.nis})` : siswa.nama || `Siswa #${siswa.id}`,
    }),
    []
  )

  const searchSiswaOptions = useCallback(
    async (keyword = '') => {
      const { data } = await siswaService.getAll({ search: keyword || undefined, per_page: 20 })
      return data?.data ? data.data.map(buildSiswaOption) : []
    },
    [buildSiswaOption]
  )

  const handleSiswaChange = (e) => {
    const val = e.target.value
    setSiswaId(val)
    // Track the selected option label from async options by searching current options
    // (the SearchableSelect manages its own async state internally)
    setSelectedSiswaOption(val ? { value: val } : null)
    // Reset results when siswa changes
    setTunggakan([])
    setSelectedBulan([])
    setHasSearched(false)
  }

  // Search tunggakan
  const handleSearch = async () => {
    if (!siswaId) {
      showError('Pilih siswa terlebih dahulu')
      return
    }
    if (!tarifSppId) {
      showError('Pilih tarif SPP terlebih dahulu')
      return
    }
    if (!tahun || isNaN(Number(tahun))) {
      showError('Masukkan tahun yang valid')
      return
    }

    setLoadingSearch(true)
    setSelectedBulan([])
    const { data, error } = await pembayaranSppService.getTunggakan(siswaId, {
      tarif_spp_id: tarifSppId,
      tahun: tahun,
    })
    setLoadingSearch(false)
    setHasSearched(true)

    if (error) {
      showError('Gagal mengambil rekap tunggakan')
      setTunggakan([])
      return
    }

    const items = data?.data ?? []
    setTunggakan(items)

    if (items.length === 0) {
      showSuccess('Tidak ada tunggakan untuk periode ini')
    }
  }

  // Checkbox selection
  const toggleBulan = (bulan) => {
    setSelectedBulan((prev) =>
      prev.includes(bulan) ? prev.filter((b) => b !== bulan) : [...prev, bulan]
    )
  }

  const toggleAll = () => {
    if (selectedBulan.length === tunggakan.length) {
      setSelectedBulan([])
    } else {
      setSelectedBulan(tunggakan.map((t) => t.bulan))
    }
  }

  const totalTerpilih = tunggakan
    .filter((t) => selectedBulan.includes(t.bulan))
    .reduce((sum, t) => sum + (t.total ?? t.nominal ?? 0), 0)

  // Pay selected months
  const handleBayarMultiple = async () => {
    if (selectedBulan.length === 0) {
      showError('Pilih minimal satu bulan untuk dibayar')
      return
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Pembayaran',
      html: `Bayar <strong>${selectedBulan.length} bulan</strong> tunggakan SPP?<br/>Total: <strong>${formatCurrency(totalTerpilih)}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Bayar!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
    })

    if (!result.isConfirmed) return

    setLoadingBayar(true)
    const { data, error } = await pembayaranSppService.bayarMultiple({
      mst_siswa_id: parseInt(siswaId),
      mst_tarif_spp_id: parseInt(tarifSppId),
      tahun: parseInt(tahun),
      bulan: selectedBulan,
      tanggal_bayar: new Date().toISOString().split('T')[0],
    })
    setLoadingBayar(false)

    if (error) {
      const msg = error?.message || 'Gagal memproses pembayaran'
      showError(msg)
      return
    }

    showSuccess(`${selectedBulan.length} bulan SPP berhasil dibayar`)
    // Refresh tunggakan list
    handleSearch()
  }

  // Initiate Winpay online payment for a single selected month
  const handleBayarOnline = async () => {
    if (selectedBulan.length !== 1) {
      showError('Pilih tepat satu bulan untuk bayar online')
      return
    }

    const bulanDipilih = selectedBulan[0]
    const nominal = tunggakan.find((t) => t.bulan === bulanDipilih)?.nominal ?? totalTerpilih

    const result = await Swal.fire({
      title: 'Bayar Online via Winpay',
      html: `Buat link pembayaran untuk <strong>${BULAN_MAP[bulanDipilih]} ${tahun}</strong>?<br/>Nominal: <strong>${formatCurrency(nominal)}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Buat Link',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
    })

    if (!result.isConfirmed) return

    setLoadingBayarOnline(true)
    const { data, error } = await pembayaranSppService.bayarOnline({
      mst_siswa_id: parseInt(siswaId),
      mst_tarif_spp_id: parseInt(tarifSppId),
      tahun: parseInt(tahun),
      bulan: bulanDipilih,
    })
    setLoadingBayarOnline(false)

    if (error) {
      const msg = (typeof error === 'object' ? error?.message : error) || 'Gagal membuat link pembayaran online'
      showError(msg)
      return
    }

    const checkoutUrl = data?.data?.checkout_url
    if (checkoutUrl) {
      await Swal.fire({
        title: 'Link Pembayaran Siap',
        html: `Link pembayaran berhasil dibuat.<br/><br/>
          <a href="${checkoutUrl}" target="_blank" rel="noopener noreferrer"
             class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Buka Halaman Pembayaran
          </a>
          <div class="mt-3 text-xs text-gray-500 break-all">${checkoutUrl}</div>`,
        icon: 'success',
        confirmButtonText: 'Tutup',
      })
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rekap Tunggakan SPP</h1>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Filter Pencarian</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Siswa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Siswa <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="mst_siswa_id"
                value={siswaId}
                onChange={handleSiswaChange}
                options={selectedSiswaOption ? [selectedSiswaOption] : []}
                loadOptions={searchSiswaOptions}
                placeholder="Pilih Siswa..."
                searchPlaceholder="Cari nama atau NIS..."
                noOptionsText="Siswa tidak ditemukan"
              />
            </div>

            {/* Tarif SPP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tarif SPP <span className="text-red-500">*</span>
              </label>
              <select
                value={tarifSppId}
                onChange={(e) => {
                  setTarifSppId(e.target.value)
                  setTunggakan([])
                  setSelectedBulan([])
                  setHasSearched(false)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              >
                <option value="">-- Pilih Tarif SPP --</option>
                {tarifOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div>
              <Input
                label="Tahun"
                type="number"
                value={tahun}
                onChange={(e) => {
                  setTahun(e.target.value)
                  setTunggakan([])
                  setSelectedBulan([])
                  setHasSearched(false)
                }}
                min="2020"
                max="2099"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSearch} disabled={loadingSearch}>
              {loadingSearch ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Mencari...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search size={16} />
                  Cari Tunggakan
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Hasil Tunggakan
                {tunggakan.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({tunggakan.length} bulan belum lunas)
                  </span>
                )}
              </h3>
              {tunggakan.length > 0 && selectedBulan.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <PermissionGuard permission="pembayaran-spp.create">
                    <Button
                      onClick={handleBayarMultiple}
                      disabled={loadingBayar || loadingBayarOnline}
                      variant="primary"
                    >
                      {loadingBayar ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Memproses...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard size={16} />
                          Bayar Tunai {selectedBulan.length} Bulan ({formatCurrency(totalTerpilih)})
                        </span>
                      )}
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="pembayaran-spp.create">
                    <Button
                      onClick={handleBayarOnline}
                      disabled={loadingBayarOnline || loadingBayar || selectedBulan.length !== 1}
                      variant="secondary"
                      title={selectedBulan.length !== 1 ? 'Pilih tepat 1 bulan untuk bayar online' : 'Buat link pembayaran online via Winpay'}
                    >
                      {loadingBayarOnline ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                          Membuat link...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Globe size={16} />
                          Bayar Online
                        </span>
                      )}
                    </Button>
                  </PermissionGuard>
                </div>
              )}
            </div>

            {tunggakan.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertCircle size={40} className="mb-3" />
                <p className="text-sm">Tidak ada tunggakan untuk periode ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4 text-left">
                        <button
                          onClick={toggleAll}
                          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                          title={selectedBulan.length === tunggakan.length ? 'Batal semua' : 'Pilih semua'}
                        >
                          {selectedBulan.length === tunggakan.length ? (
                            <CheckSquare size={16} className="text-primary-600" />
                          ) : (
                            <Square size={16} />
                          )}
                          <span className="text-xs font-medium">Semua</span>
                        </button>
                      </th>
                      <th className="pb-3 pr-4 text-left font-medium text-gray-700 dark:text-gray-300">Bulan</th>
                      <th className="pb-3 pr-4 text-right font-medium text-gray-700 dark:text-gray-300">Nominal SPP</th>
                      <th className="pb-3 pr-4 text-right font-medium text-gray-700 dark:text-gray-300">Denda</th>
                      <th className="pb-3 text-right font-medium text-gray-700 dark:text-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tunggakan.map((item) => {
                      const checked = selectedBulan.includes(item.bulan)
                      return (
                        <tr
                          key={item.bulan}
                          className={`cursor-pointer transition-colors ${
                            checked
                              ? 'bg-primary-50 dark:bg-primary-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          onClick={() => toggleBulan(item.bulan)}
                        >
                          <td className="py-3 pr-4">
                            {checked ? (
                              <CheckSquare size={16} className="text-primary-600" />
                            ) : (
                              <Square size={16} className="text-gray-400" />
                            )}
                          </td>
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                            {BULAN_MAP[item.bulan] || item.bulan} {tahun}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.nominal)}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {item.denda > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {formatCurrency(item.denda)}
                                {item.bulan_terlambat > 0 && (
                                  <span className="ml-1 text-xs text-gray-400">
                                    ({item.bulan_terlambat} bln)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.total ?? item.nominal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {selectedBulan.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                        <td colSpan={4} className="pt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total dipilih ({selectedBulan.length} bulan)
                        </td>
                        <td className="pt-3 text-right text-base font-bold text-primary-600">
                          {formatCurrency(totalTerpilih)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default PembayaranSppTunggakan
