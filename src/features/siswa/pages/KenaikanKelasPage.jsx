import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  GraduationCap,
  School,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  MoveRight,
} from "lucide-react"
import Card from "../../../components/ui/Card"
import Button from "../../../components/ui/Button"
import { kelasService } from "../../kelas/services/kelasService"
import { siswaService } from "../services/siswaService"
import { showSuccess, showError, showConfirm } from "../../../utils/sweetalert"

const KenaikanKelasPage = () => {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [fromKelasId, setFromKelasId] = useState("")
  const [toKelasId, setToKelasId] = useState("")
  const [action, setAction] = useState("promote")
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const res = await kelasService.getAll({ per_page: 200 })
      const list = res?.data?.data || res?.data || []
      setClasses(Array.isArray(list) ? list : [])
    } catch {
      showError("Gagal memuat daftar kelas")
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const fetchStudents = useCallback(async (kelasId) => {
    if (!kelasId) {
      setStudents([])
      setSelectedIds([])
      return
    }
    setLoadingStudents(true)
    try {
      const res = await siswaService.getByKelas(kelasId)
      const list = res?.data || []
      setStudents(Array.isArray(list) ? list : list?.data || [])
      setSelectedIds([])
    } catch {
      showError("Gagal memuat data siswa kelas asal")
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  const handleFromChange = (e) => {
    const val = e.target.value
    setFromKelasId(val)
    if (val === toKelasId) setToKelasId("")
    fetchStudents(val)
  }

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter(
      (s) =>
        s.nama?.toLowerCase().includes(q) ||
        s.nis?.toLowerCase().includes(q)
    )
  }, [students, searchQuery])

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const fSet = new Set(filteredStudents.map((s) => s.id))
      setSelectedIds((prev) => prev.filter((id) => !fSet.has(id)))
    } else {
      const fSet = new Set(filteredStudents.map((s) => s.id))
      setSelectedIds((prev) => Array.from(new Set([...prev, ...fSet])))
    }
  }

  const toggleStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const targetClass = useMemo(
    () => classes.find((c) => String(c.id) === String(toKelasId)) || null,
    [classes, toKelasId]
  )
  const targetCapacity = targetClass?.kapasitas ?? 30
  const targetCurrentCount = targetClass?.jumlah_siswa ?? 0
  const selectedCount = selectedIds.length
  const projectedTotal = targetCurrentCount + selectedCount
  const isOverCapacity =
    action === "promote" && targetClass && projectedTotal > targetCapacity
  const capacityPercent =
    targetCapacity > 0
      ? Math.min(100, Math.round((projectedTotal / targetCapacity) * 100))
      : 0
  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds]
  )

  const handleSubmit = async () => {
    if (selectedCount === 0) return showError("Pilih minimal satu siswa.")
    if (action === "promote") {
      if (!toKelasId) return showError("Pilih kelas tujuan terlebih dahulu.")
      if (String(fromKelasId) === String(toKelasId))
        return showError("Kelas tujuan tidak boleh sama dengan kelas asal.")
      if (isOverCapacity)
        return showError(
          `Kapasitas kelas tujuan tidak mencukupi! Kapasitas: ${targetCapacity}, total akan menjadi ${projectedTotal}.`
        )
    }

    const confMsg =
      action === "lulus"
        ? `Luluskan ${selectedCount} siswa terpilih? Status akan diubah ke Lulus.`
        : `Pindahkan ${selectedCount} siswa ke kelas "${targetClass?.nama_kelas}"?`

    const result = await showConfirm(
      confMsg,
      action === "lulus" ? "Konfirmasi Kelulusan" : "Konfirmasi Pindah Kelas"
    )
    if (!result.isConfirmed) return

    setSubmitting(true)
    try {
      const res = await siswaService.batchPromote({
        action,
        from_mst_kelas_id: fromKelasId ? Number(fromKelasId) : undefined,
        to_mst_kelas_id: action === "promote" ? Number(toKelasId) : undefined,
        siswa_ids: selectedIds,
      })
      if (res?.error) {
        showError(res.error?.message || "Gagal memproses mutasi siswa.")
        return
      }
      showSuccess(
        action === "lulus"
          ? `${selectedCount} siswa berhasil diluluskan!`
          : `${selectedCount} siswa berhasil dipindahkan ke ${targetClass?.nama_kelas}!`
      )
      setSelectedIds([])
      await Promise.all([fetchStudents(fromKelasId), fetchClasses()])
    } catch (err) {
      showError(err?.message || "Gagal memproses mutasi siswa.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/siswa")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Data Siswa
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <School className="w-7 h-7 text-primary-600" /> Kenaikan Kelas & Mutasi Rombel Massal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pindahkan siswa antar kelas atau proses kelulusan akhir tahun dengan validasi kapasitas otomatis.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            fetchClasses()
            if (fromKelasId) fetchStudents(fromKelasId)
          }}
          disabled={loadingClasses || loadingStudents}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loadingClasses || loadingStudents ? "animate-spin" : ""}`}
          />{" "}
          Segarkan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Kiri: Kelas Asal & Siswa */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" /> 1. Kelas Asal
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pilih Rombel Asal
                </label>
                <select
                  aria-label="Pilih Kelas Asal"
                  value={fromKelasId}
                  onChange={handleFromChange}
                  disabled={loadingClasses || submitting}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">-- Pilih Kelas Asal --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_kelas} (Tingkat {c.tingkat}) - {c.jumlah_siswa ?? 0} Siswa
                    </option>
                  ))}
                </select>
              </div>
              {students.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NIS..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/80 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="Pilih Semua Siswa"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    disabled={filteredStudents.length === 0 || submitting}
                    className="rounded text-primary-600"
                  />
                  <span>Pilih Semua</span>
                </label>
                <span className="text-gray-500 dark:text-gray-400">
                  {selectedIds.length} dari {students.length} terpilih
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {loadingStudents ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-1 text-primary-600" />{" "}
                    Memuat siswa...
                  </div>
                ) : !fromKelasId ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    Pilih kelas asal terlebih dahulu.
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    Tidak ada siswa yang ditemukan.
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const isSelected = selectedIds.includes(s.id)
                    return (
                      <div
                        key={s.id}
                        onClick={() => !submitting && toggleStudent(s.id)}
                        className={`flex items-center justify-between p-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                          isSelected ? "bg-primary-50 dark:bg-primary-950/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${s.nama}`}
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={submitting}
                            className="rounded text-primary-600"
                          />
                          <div className="truncate">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {s.nama}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              NIS: {s.nis || "-"}
                            </p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {s.jenis_kelamin === "L" ||
                          s.jenis_kelamin === "Laki-laki" ||
                          s.jenis_kelamin === 1
                            ? "L"
                            : "P"}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Panel Tengah: Aksi & Eksekusi */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 text-center">
            <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              2. Aksi
            </h2>
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => setAction("promote")}
                disabled={submitting}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 ${
                  action === "promote"
                    ? "border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
                    : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <MoveRight className="w-3.5 h-3.5" /> Naik / Mutasi
              </button>
              <button
                type="button"
                onClick={() => setAction("lulus")}
                disabled={submitting}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 ${
                  action === "lulus"
                    ? "border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Luluskan Siswa
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-md p-2 mb-4 text-xs">
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">
                Terpilih
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedCount}
              </span>
            </div>

            <Button
              variant={action === "lulus" ? "warning" : "primary"}
              onClick={handleSubmit}
              disabled={
                submitting ||
                selectedCount === 0 ||
                (action === "promote" && (!toKelasId || isOverCapacity))
              }
              loading={submitting}
              className="w-full py-2.5 text-xs font-semibold justify-center"
            >
              {action === "lulus" ? (
                <>Luluskan Terpilih</>
              ) : (
                <>
                  Pindahkan Terpilih <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Panel Kanan: Target & Kapasitas */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {action === "lulus" ? (
                  <>
                    <GraduationCap className="w-5 h-5 text-amber-600" /> 3. Kelulusan Siswa
                  </>
                ) : (
                  <>
                    <School className="w-5 h-5 text-primary-600" /> 3. Kelas Tujuan & Kapasitas
                  </>
                )}
              </h2>
            </div>

            {action === "promote" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pilih Kelas Tujuan
                  </label>
                  <select
                    aria-label="Pilih Kelas Tujuan"
                    value={toKelasId}
                    onChange={(e) => setToKelasId(e.target.value)}
                    disabled={loadingClasses || submitting}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">-- Pilih Kelas Tujuan --</option>
                    {classes
                      .filter((c) => String(c.id) !== String(fromKelasId))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nama_kelas} (Tingkat {c.tingkat}) - Kapasitas: {c.kapasitas ?? 30}
                        </option>
                      ))}
                  </select>
                </div>

                {targetClass && (
                  <div
                    className={`rounded-lg border p-3.5 space-y-2 text-xs ${
                      isOverCapacity
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        {isOverCapacity ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        Indikator Kapasitas
                      </span>
                      <span
                        className={`font-bold ${
                          isOverCapacity
                            ? "text-red-600"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {projectedTotal} / {targetCapacity} Siswa
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isOverCapacity ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-600 dark:text-gray-400">
                      <span>Saat ini: {targetCurrentCount}</span>
                      <span>+ {selectedCount} baru</span>
                      <span
                        className={`font-semibold ${
                          isOverCapacity
                            ? "text-red-600"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {isOverCapacity
                          ? `Kelebihan ${projectedTotal - targetCapacity} kursi`
                          : `Sisa ${targetCapacity - projectedTotal} kursi`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300">
                Siswa terpilih akan ditandai dengan status resmi <strong>Lulus</strong> dan dilepaskan dari rombel kelas aktif.
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                <span>Pratinjau Siswa Diproses ({selectedCount})</span>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] text-gray-500 hover:text-red-600"
                  >
                    Batal Pilih
                  </button>
                )}
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {selectedStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    Belum ada siswa yang dipilih.
                  </div>
                ) : (
                  selectedStudents.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-gray-400 font-mono w-4 text-right">
                          {idx + 1}.
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {s.nama}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            NIS: {s.nis || "-"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        disabled={submitting}
                        className="text-gray-400 hover:text-red-500 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default KenaikanKelasPage
