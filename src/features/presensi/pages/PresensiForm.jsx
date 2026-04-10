import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { presensiService } from '../services/presensiService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { jadwalPelajaranService } from '../../jadwal-pelajaran/services/jadwalPelajaranService'
import { referenceService } from '../../../services/referenceService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const PresensiForm = () => {
  usePageTitle()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [fetchingStatus, setFetchingStatus] = useState(true)

  // ── Edit mode state ──────────────────────────────────────────────────────────
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [rawPresensiStatus, setRawPresensiStatus] = useState(null)
  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_guru_mapel_id: '',
    tanggal: '',
    jam_masuk: '',
    status: '',
    keterangan: ''
  })
  const [errors, setErrors] = useState({})

  // ── Bulk create state ────────────────────────────────────────────────────────
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [selectedGuruMapelId, setSelectedGuruMapelId] = useState('')
  const [bulkTanggal, setBulkTanggal] = useState('')
  const [bulkJamMasuk, setBulkJamMasuk] = useState('')
  const [siswaList, setSiswaList] = useState([])
  const [siswaRows, setSiswaRows] = useState({})
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [bulkErrors, setBulkErrors] = useState({})

  useEffect(() => {
    fetchStatusOptions()
    if (isEditMode) fetchPresensi()
  }, [id])

  useEffect(() => {
    if (rawPresensiStatus !== null && statusOptions.length > 0) {
      const matched = statusOptions.find(opt => String(opt.value) === String(rawPresensiStatus))
      if (matched) setFormData(prev => ({ ...prev, status: matched.value }))
      setRawPresensiStatus(null)
    }
  }, [rawPresensiStatus, statusOptions])

  const fetchStatusOptions = async () => {
    setFetchingStatus(true)
    const { data, error } = await referenceService.getReferencesByCategory('status_presensi')
    if (data && !error) {
      const options = (data.data || []).map(item => ({
        value: item.kode,
        label: item.nama.charAt(0).toUpperCase() + item.nama.slice(1)
      }))
      setStatusOptions(options)
    } else {
      showError('Gagal mengambil data status presensi')
    }
    setFetchingStatus(false)
  }

  // ── Edit mode helpers ────────────────────────────────────────────────────────
  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data } = await siswaService.getAll({ search: keyword || undefined, per_page: 20 })
    return (data?.data || []).map(buildSiswaOption)
  }, [buildSiswaOption])

  const hydrateSelectedSiswaOption = useCallback(async (siswaId) => {
    if (!siswaId) {
      setSelectedSiswaOption(null)
      return
    }

    const { data } = await siswaService.getById(siswaId)
    const siswa = data?.data

    if (siswa) {
      setSelectedSiswaOption(buildSiswaOption(siswa))
    }
  }, [buildSiswaOption])

  const fetchPresensi = async () => {
    setFetchingData(true)
    const { data, error } = await presensiService.getPresensiById(id)
    if (data) {
      const presensi = data.data
      const siswaId = String(presensi.mst_siswa_id || presensi.siswa?.id || '')

      setFormData({
        mst_siswa_id: siswaId,
        mst_guru_mapel_id: presensi.mst_guru_mapel_id || presensi.guru_mapel?.id || '',
        tanggal: presensi.tanggal || '',
        jam_masuk: presensi.jam_masuk || '',
        status: '',
        keterangan: presensi.keterangan || ''
      })
      setRawPresensiStatus(presensi.status)

      if (presensi.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(presensi.siswa))
      }
    } else {
      showError('Gagal mengambil data presensi')
      navigate('/akademik/presensi')
    }
    setFetchingData(false)
  }

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validateEdit = () => {
    const newErrors = {}
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (!formData.mst_guru_mapel_id) newErrors.mst_guru_mapel_id = 'Guru Mapel wajib dipilih'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (!formData.status) newErrors.status = 'Status wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!validateEdit()) return

    setLoading(true)
    const submitData = {
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      tanggal: formData.tanggal,
      jam_masuk: formData.jam_masuk || null,
      status: formData.status,
      keterangan: formData.keterangan || null
    }

    const { error } = await presensiService.updatePresensi(id, submitData)
    if (!error) {
      showSuccess('Presensi berhasil diperbarui!')
      navigate('/akademik/presensi')
    } else {
      if (error.errors) setErrors(error.errors)
      else showError('Gagal memperbarui presensi')
    }
    setLoading(false)
  }

  // ── Bulk create helpers ──────────────────────────────────────────────────────
  const buildKelasOption = useCallback((kelas) => ({
    value: String(kelas.id),
    label: kelas.nama_kelas || kelas.nama || `Kelas #${kelas.id}`
  }), [])

  const buildGuruMapelOption = useCallback((guruMapel) => {
    if (!guruMapel?.id) return null
    const guruNama = guruMapel?.guru?.nama || 'Guru'
    const mapelNama = guruMapel?.mapel?.nama_mapel || guruMapel?.mapel?.nama || 'Mapel'
    return {
      value: String(guruMapel.id),
      label: `${guruNama} - ${mapelNama}`
    }
  }, [])

  const searchKelasOptions = useCallback(async (keyword = '') => {
    const { data } = await kelasService.getAll({ search: keyword || undefined, per_page: 50 })
    return (data?.data || []).map(buildKelasOption)
  }, [buildKelasOption])

  const searchGuruMapelOptions = useCallback(async (keyword = '') => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    const { data } = await jadwalPelajaranService.getAll({
      search: normalizedKeyword || undefined,
      per_page: 50
    })

    const jadwalList = data?.data || []
    const seenIds = new Set()
    return jadwalList.reduce((options, jadwal) => {
      const option = buildGuruMapelOption(jadwal.guru_mapel)
      if (!option || seenIds.has(option.value)) return options
      if (normalizedKeyword && !option.label.toLowerCase().includes(normalizedKeyword)) return options
      seenIds.add(option.value)
      options.push(option)
      return options
    }, [])
  }, [buildGuruMapelOption])

  const handleKelasChange = useCallback(async (e) => {
    const kelasId = e.target.value
    setSelectedKelasId(kelasId)
    setSiswaList([])
    setSiswaRows({})
    setBulkErrors(prev => ({ ...prev, kelas: null, siswa: null }))
    if (!kelasId) return

    setLoadingSiswa(true)
    const { data, error } = await kelasService.getSiswaByKelasId(kelasId)
    if (data) {
      const list = data.data?.siswa || []
      setSiswaList(list)
      const defaultStatus = statusOptions[0]?.value ?? ''
      const rows = {}
      for (const s of list) {
        rows[s.id] = { status: defaultStatus, jam_masuk: '', keterangan: '' }
      }
      setSiswaRows(rows)
    } else {
      showError('Gagal mengambil data siswa')
    }
    setLoadingSiswa(false)
  }, [statusOptions])

  const handleSiswaRowChange = (siswaId, field, value) => {
    setSiswaRows(prev => ({ ...prev, [siswaId]: { ...prev[siswaId], [field]: value } }))
  }

  const setAllStatus = (status) => {
    setSiswaRows(prev => {
      const updated = {}
      for (const [sid, row] of Object.entries(prev)) {
        updated[sid] = { ...row, status }
      }
      return updated
    })
  }

  const validateBulk = () => {
    const newErrors = {}
    if (!selectedKelasId) newErrors.kelas = 'Kelas wajib dipilih'
    if (!selectedGuruMapelId) newErrors.guru_mapel = 'Guru Mapel wajib dipilih'
    if (!bulkTanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (siswaList.length === 0) newErrors.siswa = 'Pilih kelas terlebih dahulu untuk menampilkan siswa'
    if (siswaList.length > 0 && Object.values(siswaRows).some(r => !r.status)) {
      newErrors.siswa_status = 'Semua siswa harus memiliki status'
    }
    setBulkErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitBulk = async (e) => {
    e.preventDefault()
    if (!validateBulk()) return

    setLoading(true)
    const submitData = {
      mst_guru_mapel_id: parseInt(selectedGuruMapelId),
      tanggal: bulkTanggal,
      presensi: siswaList.map(siswa => ({
        mst_siswa_id: siswa.id,
        status: parseInt(siswaRows[siswa.id]?.status),
        jam_masuk: siswaRows[siswa.id]?.jam_masuk || bulkJamMasuk || null,
        keterangan: siswaRows[siswa.id]?.keterangan || null
      }))
    }

    const { error } = await presensiService.bulkCreatePresensi(submitData)
    if (!error) {
      showSuccess('Presensi berhasil disimpan!')
      navigate('/akademik/presensi')
    } else {
      if (error.errors) setBulkErrors(error.errors)
      else showError('Gagal menyimpan presensi')
    }
    setLoading(false)
  }

  const errMsg = (field, errs) => {
    const val = errs[field]
    if (!val) return null
    return Array.isArray(val) ? val[0] : val
  }

  // ── Edit mode render ─────────────────────────────────────────────────────────
  if (isEditMode) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/presensi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Presensi</h1>
      </div>

      <Card>
        {fetchingData || fetchingStatus ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Siswa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  disabled
                  placeholder="Pilih siswa..."
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errMsg('mst_siswa_id', errors)}
                />
              </div>

              {/* Guru Mapel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru Mapel <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="mst_guru_mapel_id"
                  value={formData.mst_guru_mapel_id}
                  onChange={handleChange}
                  placeholder="Masukkan ID Guru Mapel"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errMsg('mst_guru_mapel_id', errors) && (
                  <p className="mt-1 text-sm text-red-500">{errMsg('mst_guru_mapel_id', errors)}</p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errMsg('tanggal', errors) && (
                  <p className="mt-1 text-sm text-red-500">{errMsg('tanggal', errors)}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Status</option>
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errMsg('status', errors) && (
                  <p className="mt-1 text-sm text-red-500">{errMsg('status', errors)}</p>
                )}
              </div>

              {/* Jam Masuk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  name="jam_masuk"
                  value={formData.jam_masuk}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Keterangan opsional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/presensi')}>
                Batal
              </Button>
              <PermissionGuard permission="presensi.edit">
                <Button type="submit" disabled={loading}>
                  <Save size={18} className="mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )

  // ── Bulk create render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/presensi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Input Presensi Kelas</h1>
      </div>

      {fetchingStatus ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmitBulk} className="space-y-6">
          {/* Filter section */}
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">Informasi Presensi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="kelas_id"
                    value={selectedKelasId}
                    onChange={handleKelasChange}
                    placeholder="Pilih kelas..."
                    options={[]}
                    loadOptions={searchKelasOptions}
                    searchPlaceholder="Cari kelas..."
                    noOptionsText="Kelas tidak ditemukan"
                    error={errMsg('kelas', bulkErrors)}
                  />
                </div>

                {/* Guru Mapel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Guru / Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="guru_mapel_id"
                    value={selectedGuruMapelId}
                    onChange={(e) => {
                      setSelectedGuruMapelId(e.target.value)
                      setBulkErrors(prev => ({ ...prev, guru_mapel: null }))
                    }}
                    placeholder="Pilih guru mapel..."
                    options={[]}
                    loadOptions={searchGuruMapelOptions}
                    searchPlaceholder="Cari guru atau mata pelajaran..."
                    noOptionsText="Guru mapel tidak ditemukan"
                    error={errMsg('guru_mapel', bulkErrors)}
                  />
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bulkTanggal}
                    onChange={(e) => {
                      setBulkTanggal(e.target.value)
                      setBulkErrors(prev => ({ ...prev, tanggal: null }))
                    }}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  {errMsg('tanggal', bulkErrors) && (
                    <p className="mt-1 text-sm text-red-500">{errMsg('tanggal', bulkErrors)}</p>
                  )}
                </div>

                {/* Jam Masuk (default) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jam Masuk (default)
                  </label>
                  <input
                    type="time"
                    value={bulkJamMasuk}
                    onChange={(e) => setBulkJamMasuk(e.target.value)}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Siswa table */}
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  Daftar Siswa
                  {siswaList.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({siswaList.length} siswa)
                    </span>
                  )}
                </h2>

                {/* Quick-set all status */}
                {siswaList.length > 0 && statusOptions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Set semua:</span>
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAllStatus(opt.value)}
                        className="px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {errMsg('siswa', bulkErrors) && (
                <p className="text-sm text-red-500">{errMsg('siswa', bulkErrors)}</p>
              )}
              {errMsg('siswa_status', bulkErrors) && (
                <p className="text-sm text-red-500">{errMsg('siswa_status', bulkErrors)}</p>
              )}

              {loadingSiswa ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : siswaList.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                  {selectedKelasId ? 'Tidak ada siswa di kelas ini' : 'Pilih kelas untuk menampilkan data siswa'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-8">#</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">NIS</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Nama Siswa</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-40">
                          Status <span className="text-red-500">*</span>
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswaList.map((siswa, idx) => {
                        const row = siswaRows[siswa.id] || { status: '', jam_masuk: '', keterangan: '' }
                        return (
                          <tr
                            key={siswa.id}
                            className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-mono">{siswa.nis || '-'}</td>
                            <td className="py-2 px-3 text-gray-900 dark:text-white">{siswa.nama}</td>
                            <td className="py-2 px-3">
                              <select
                                value={row.status}
                                onChange={(e) => handleSiswaRowChange(siswa.id, 'status', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              >
                                <option value="">Pilih</option>
                                {statusOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.keterangan}
                                onChange={(e) => handleSiswaRowChange(siswa.id, 'keterangan', e.target.value)}
                                placeholder="Keterangan..."
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/akademik/presensi')}>
              Batal
            </Button>
            <PermissionGuard permission="presensi.bulk">
              <Button type="submit" disabled={loading || siswaList.length === 0}>
                <Save size={18} className="mr-2" />
                {loading ? 'Menyimpan...' : `Simpan Presensi (${siswaList.length} siswa)`}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      )}
    </div>
  )
}

export default PresensiForm