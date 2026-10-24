import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  X,
  Plus,
  Trash2,
  CreditCard,
  Printer,
  CheckCircle2,
} from "lucide-react"
import Button from "../../../components/ui/Button"
import SearchableSelect from "../../../components/ui/SearchableSelect"
import { pembayaranSppService, tarifSppService } from "../services/sppService"
import { siswaService } from "../../siswa/services/siswaService"
import { showError, showSuccess } from "../../../utils/sweetalert"

const BULAN_OPTIONS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Agu" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Okt" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Des" },
]

const BULAN_FULL = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const METODE_OPTIONS = [
  { value: 1, label: "Tunai" },
  { value: 2, label: "Transfer Bank" },
  { value: 3, label: "Virtual Account" },
  { value: 4, label: "QRIS" },
]

const formatCurrency = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0)

const createEmptyItem = (id) => ({
  id,
  mst_siswa_id: "",
  selectedSiswaOption: null,
  siswaKelasId: null,
  mst_tarif_spp_id: "",
  nominal: 0,
  tahun: new Date().getFullYear(),
  bulan: [],
  tanggal_bayar: new Date().toISOString().split("T")[0],
  metode_pembayaran: 1,
  keterangan: "",
})

export default function PembayaranSppBatchModal({ isOpen, onClose, onSuccess }) {
  const [items, setItems] = useState([createEmptyItem(1)])
  const [tarifOptions, setTarifOptions] = useState([])
  const [tarifMap, setTarifMap] = useState({})
  const [loadingTarif, setLoadingTarif] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [receiptResult, setReceiptResult] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const dialogRef = useRef(null)
  const nextIdRef = useRef(2)

  useEffect(() => {
    if (!isOpen) return
    const fetchTarif = async () => {
      setLoadingTarif(true)
      const { data } = await tarifSppService.getAll({ per_page: 100 })
      if (data?.data) {
        const options = data.data.map((t) => ({
          value: String(t.id),
          label: `${t.kelas?.nama_kelas || "Umum"} — ${formatCurrency(t.nominal)}`,
          nominal: Number(t.nominal || 0),
          kelasId: t.mst_kelas_id,
        }))
        const map = {}
        data.data.forEach((t) => {
          map[String(t.id)] = Number(t.nominal || 0)
        })
        setTarifOptions(options)
        setTarifMap(map)
      }
      setLoadingTarif(false)
    }
    fetchTarif()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setItems([createEmptyItem(1)])
      nextIdRef.current = 2
      setReceiptResult(null)
      setFormErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && isOpen) {
        onClose?.()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, submitting, onClose])

  const searchSiswa = useCallback(async (query) => {
    const { data } = await siswaService.getAll({
      search: query || undefined,
      per_page: 20,
    })
    if (!data?.data) return []
    return data.data.map((s) => ({
      value: String(s.id),
      label: `${s.nama || "Siswa"} (${s.nis || "-"}) ${s.kelas?.nama_kelas ? "- " + s.kelas.nama_kelas : ""}`,
      kelasId: s.mst_kelas_id || s.kelas?.id,
      nama: s.nama,
    }))
  }, [])

  const handleSiswaChange = useCallback(
    (itemId, e, rawOption = null) => {
      const siswaId = e?.target?.value || (typeof e === "string" ? e : "")
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item

          let updatedTarifId = item.mst_tarif_spp_id
          let updatedNominal = item.nominal
          const selectedOption = rawOption || (siswaId ? { value: siswaId, label: `Siswa #${siswaId}` } : null)
          const kelasId = rawOption?.kelasId || null

          if (!updatedTarifId && tarifOptions.length > 0) {
            const matchingTarif = tarifOptions.find((t) => t.kelasId === kelasId) || tarifOptions[0]
            if (matchingTarif) {
              updatedTarifId = matchingTarif.value
              updatedNominal = matchingTarif.nominal
            }
          }

          return {
            ...item,
            mst_siswa_id: siswaId,
            selectedSiswaOption: selectedOption,
            siswaKelasId: kelasId,
            mst_tarif_spp_id: updatedTarifId,
            nominal: updatedNominal,
          }
        })
      )
    },
    [tarifOptions]
  )

  const handleTarifChange = useCallback(
    (itemId, tarifId) => {
      const nominal = tarifMap[tarifId] || 0
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, mst_tarif_spp_id: tarifId, nominal }
            : item
        )
      )
    },
    [tarifMap]
  )

  const toggleBulan = useCallback((itemId, bulanNum) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const exists = item.bulan.includes(bulanNum)
        const updated = exists
          ? item.bulan.filter((b) => b !== bulanNum)
          : [...item.bulan, bulanNum].sort((a, b) => a - b)
        return { ...item, bulan: updated }
      })
    )
  }, [])

  const handleSelectAllBulan = useCallback((itemId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              bulan:
                item.bulan.length === 12
                  ? []
                  : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            }
          : item
      )
    )
  }, [])

  const updateItemField = useCallback((itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }, [])

  const handleAddItem = useCallback(() => {
    const newId = nextIdRef.current++
    setItems((prev) => [...prev, createEmptyItem(newId)])
  }, [])

  const handleRemoveItem = useCallback((itemId) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((i) => i.id !== itemId)
    })
  }, [])

  const totalBulanCount = useMemo(
    () => items.reduce((sum, item) => sum + item.bulan.length, 0),
    [items]
  )

  const totalNominalCount = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.bulan.length * (item.nominal || 0), 0),
    [items]
  )

  const distinctSiswaCount = useMemo(() => {
    const set = new Set(items.map((i) => i.mst_siswa_id).filter(Boolean))
    return set.size
  }, [items])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const errors = {}

    const seenEntries = new Set()
    items.forEach((item, idx) => {
      if (!item.mst_siswa_id) {
        errors[`siswa_${item.id}`] = `Baris ${idx + 1}: Siswa harus dipilih`
      }
      if (!item.mst_tarif_spp_id) {
        errors[`tarif_${item.id}`] = `Baris ${idx + 1}: Tarif SPP harus dipilih`
      }
      if (!item.bulan || item.bulan.length === 0) {
        errors[`bulan_${item.id}`] = `Baris ${idx + 1}: Minimal pilih satu bulan SPP`
      }

      item.bulan.forEach((m) => {
        const key = `${item.mst_siswa_id}_${item.tahun}_${m}`
        if (seenEntries.has(key)) {
          errors[`dup_${item.id}`] = `Baris ${idx + 1}: Bulan ${BULAN_FULL[m]} ${item.tahun} sudah ada di baris lain`
        }
        seenEntries.add(key)
      })
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showError(Object.values(errors)[0])
      return
    }

    setFormErrors({})
    setSubmitting(true)

    try {
      const payload = {
        items: items.map((item) => ({
          mst_siswa_id: Number(item.mst_siswa_id),
          mst_tarif_spp_id: Number(item.mst_tarif_spp_id),
          bulan: item.bulan,
          tahun: Number(item.tahun),
          tanggal_bayar: item.tanggal_bayar || new Date().toISOString().split("T")[0],
          metode_pembayaran: Number(item.metode_pembayaran) || 1,
          keterangan: item.keterangan || null,
        })),
      }

      const { data, error } = await pembayaranSppService.batchBayar(payload)

      if (error) {
        const msg = error.message || error.data?.message || "Gagal memproses pembayaran batch"
        showError(msg)
        return
      }

      const responsePayload = data?.data || data
      const receipt = responsePayload?.receipt
      if (receipt) {
        setReceiptResult(receipt)
        showSuccess(`Pembayaran batch berhasil! Kwitansi: ${receipt.nomor_kwitansi}`)
      } else {
        showSuccess("Pembayaran batch SPP berhasil diproses")
        onSuccess?.()
      }
    } catch (err) {
      showError(err?.message || "Terjadi kesalahan sistem saat memproses batch pembayaran")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-spp-title"
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <CreditCard size={22} />
            </div>
            <div>
              <h2 id="batch-spp-title" className="text-lg font-bold text-gray-900 dark:text-white">
                Kasir Pembayaran SPP Kolektif
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Penyelesaian pembayaran multi-siswa & multi-bulan loket kasir
              </p>
            </div>
          </div>
          <button
            onClick={receiptResult ? onSuccess : onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {receiptResult ? (
            <div className="space-y-6">
              <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                  Pembayaran Berhasil Diselesaikan!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Nomor Kwitansi Resmi: <span className="font-mono font-bold">{receiptResult.nomor_kwitansi}</span>
                </p>
              </div>

              {/* Receipt Area */}
              <div id="receipt-print-area" className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">BUKTI PEMBAYARAN SPP</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">Kwitansi: {receiptResult.nomor_kwitansi}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Tanggal: {new Date(receiptResult.tanggal).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
                    <p>Petugas ID: {receiptResult.petugas_id}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      <tr>
                        <th className="py-2 px-3">No</th>
                        <th className="py-2 px-3">Siswa</th>
                        <th className="py-2 px-3">Bulan & Tahun</th>
                        <th className="py-2 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                      {receiptResult.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 text-xs text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium">{item.siswa_nama}</td>
                          <td className="py-2 px-3">
                            {BULAN_FULL[item.bulan]} {item.tahun}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.nominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 dark:border-gray-700 font-bold">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right">
                          Total Pembayaran ({receiptResult.total_item} transaksi):
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono text-base">
                          {formatCurrency(receiptResult.total_nominal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={handlePrintReceipt}>
                  <Printer size={16} className="mr-2" />
                  Cetak Kwitansi
                </Button>
                <Button variant="primary" onClick={onSuccess}>
                  Selesai
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {items.map((item, index) => {
                  const subtotal = item.bulan.length * (item.nominal || 0)
                  const hasError =
                    formErrors[`siswa_${item.id}`] ||
                    formErrors[`tarif_${item.id}`] ||
                    formErrors[`bulan_${item.id}`] ||
                    formErrors[`dup_${item.id}`]

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        hasError
                          ? "border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Data Pembayaran Siswa
                          </span>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                            title="Hapus baris"
                          >
                            <Trash2 size={14} />
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Siswa <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            name={`siswa_${item.id}`}
                            value={item.mst_siswa_id}
                            onChange={(e) => handleSiswaChange(item.id, e)}
                            loadOptions={searchSiswa}
                            debounceMs={0}
                            placeholder="Cari siswa (Nama/NIS)..."
                            error={formErrors[`siswa_${item.id}`]}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Tarif SPP <span className="text-red-500">*</span>
                          </label>
                          <select
                            aria-label="Pilih Tarif SPP"
                            value={item.mst_tarif_spp_id}
                            onChange={(e) => handleTarifChange(item.id, e.target.value)}
                            disabled={loadingTarif}
                            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Pilih Tarif</option>
                            {tarifOptions.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          {formErrors[`tarif_${item.id}`] && (
                            <p className="text-xs text-red-500 mt-1">{formErrors[`tarif_${item.id}`]}</p>
                          )}
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Tahun <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="2020"
                            max="2100"
                            value={item.tahun}
                            onChange={(e) => updateItemField(item.id, "tahun", parseInt(e.target.value) || 2026)}
                            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Pilih Bulan SPP ({item.bulan.length} bulan dipilih) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSelectAllBulan(item.id)}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                          >
                            {item.bulan.length === 12 ? "Batal Semua" : "Pilih Semua"}
                          </button>
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                          {BULAN_OPTIONS.map((b) => {
                            const isSelected = item.bulan.includes(b.value)
                            return (
                              <button
                                key={b.value}
                                type="button"
                                onClick={() => toggleBulan(item.id, b.value)}
                                className={`text-xs py-1.5 px-2 rounded font-medium border text-center transition-colors ${
                                  isSelected
                                    ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                }`}
                              >
                                {b.label}
                              </button>
                            )
                          })}
                        </div>
                        {formErrors[`bulan_${item.id}`] && (
                          <p className="text-xs text-red-500 mt-1">{formErrors[`bulan_${item.id}`]}</p>
                        )}
                        {formErrors[`dup_${item.id}`] && (
                          <p className="text-xs text-red-500 mt-1">{formErrors[`dup_${item.id}`]}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 items-center">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] text-gray-500 mb-0.5">Tanggal Bayar</label>
                          <input
                            type="date"
                            value={item.tanggal_bayar}
                            onChange={(e) => updateItemField(item.id, "tanggal_bayar", e.target.value)}
                            className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] text-gray-500 mb-0.5">Metode Bayar</label>
                          <select
                            aria-label="Metode Bayar"
                            value={item.metode_pembayaran}
                            onChange={(e) => updateItemField(item.id, "metode_pembayaran", parseInt(e.target.value) || 1)}
                            className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {METODE_OPTIONS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[11px] text-gray-500 mb-0.5">Keterangan (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Catatan loket..."
                            value={item.keterangan}
                            onChange={(e) => updateItemField(item.id, "keterangan", e.target.value)}
                            className="w-full text-xs rounded border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-3 text-right">
                          <span className="block text-[11px] text-gray-500">Subtotal Siswa</span>
                          <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddItem}
                  className="text-xs text-primary-600 hover:text-primary-700 border-dashed"
                >
                  <Plus size={15} className="mr-1.5" />
                  Tambah Siswa Lain
                </Button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Total Siswa</span>
                    <span className="font-bold text-gray-900 dark:text-white">{distinctSiswaCount} Orang</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Total Bulan</span>
                    <span className="font-bold text-gray-900 dark:text-white">{totalBulanCount} Bulan</span>
                  </div>
                  <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
                    <span className="text-xs text-gray-500 block">Total Kasir / Bayar</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalNominalCount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || totalBulanCount === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
                  >
                    <CreditCard size={16} className="mr-2" />
                    {submitting ? "Memproses..." : `Bayar ${formatCurrency(totalNominalCount)}`}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
