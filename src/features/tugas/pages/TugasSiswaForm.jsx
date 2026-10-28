import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Link2, Users, RotateCcw, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import FileUpload from '../../../components/ui/FileUpload'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import usePermission from '../../../hooks/usePermission'
import useAuthStore from '../../../store/useAuthStore'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import {
  isSubmissionGraded,
  getSubmissionScore,
  getSubmissionLink,
  isGroupSubmission,
  getGroupMembers,
  isRevisionRequested,
} from '../utils/tugasFileUtils'

const STATUS_KUMPUL_OPTIONS = [
  { value: '0', label: 'Belum' },
  { value: '1', label: 'Tepat Waktu' },
  { value: '2', label: 'Terlambat' },
]

const TugasSiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialTugasId = location.state?.mst_tugas_id || location.state?.tugas_id || ''
  const isEditMode = !!id
  const { hasPermission } = usePermission()
  const canGrade = hasPermission('tugas-siswa.nilai')
  const [originalNilai, setOriginalNilai] = useState('')

  const user = useAuthStore((state) => state.user)
  const isSiswa = user?.role?.toLowerCase?.() === 'siswa' || user?.roles?.some?.((r) => (r.code || r)?.toLowerCase?.() === 'siswa')
  const currentSiswaId = user?.profile?.id ?? user?.profile?.mst_siswa_id ?? user?.profile?.siswa_id ?? user?.mst_siswa_id ?? user?.siswa?.id ?? ''
  const authSiswaName = user?.profile?.nama || user?.siswa?.nama || user?.name || (currentSiswaId ? `Siswa #${currentSiswaId}` : 'Siswa')
  const authSiswaNis = user?.profile?.nis || user?.siswa?.nis || ''
  const authSiswaLabel = authSiswaNis ? `${authSiswaNis} - ${authSiswaName}` : authSiswaName
  const [selectedSiswaLabel, setSelectedSiswaLabel] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_tugas_id: (!isEditMode && initialTugasId) ? String(initialTugasId) : '',
    mst_siswa_id: (!isEditMode && isSiswa && currentSiswaId) ? String(currentSiswaId) : '',
    jawaban_teks: '',
    file_siswa: '',
    link_tugas: '',
    is_kelompok: false,
    nama_kelompok: '',
    anggota_kelompok_ids: [],
    perlu_revisi: false,
    waktu_kumpul: '',
    status_kumpul: '',
    nilai: '',
    catatan_guru: ''
  })

  const [errors, setErrors] = useState({})
  const [tugasOptions, setTugasOptions] = useState([])
  const [tugasMap, setTugasMap] = useState({})
  const [siswaOptions, setSiswaOptions] = useState([])
  const [memberSelectValue, setMemberSelectValue] = useState('')

  useEffect(() => {
    fetchTugasOptions()
    if (!isSiswa) {
      fetchSiswaOptions()
    }
    if (isEditMode) {
      fetchTugasSiswa()
    }
  }, [id, isSiswa])

  useEffect(() => {
    if (formData.is_kelompok && siswaOptions.length === 0) {
      fetchSiswaOptions()
    }
  }, [formData.is_kelompok])

  useEffect(() => {
    if (isSiswa && currentSiswaId && !isEditMode) {
      setFormData(prev => (prev.mst_siswa_id ? prev : { ...prev, mst_siswa_id: String(currentSiswaId) }))
    }
    if (initialTugasId && !isEditMode) {
      setFormData(prev => (prev.mst_tugas_id ? prev : { ...prev, mst_tugas_id: String(initialTugasId) }))
    }
  }, [isSiswa, currentSiswaId, initialTugasId, isEditMode])

  const selectedTugas = useMemo(
    () => (formData.mst_tugas_id ? tugasMap[String(formData.mst_tugas_id)] : null),
    [formData.mst_tugas_id, tugasMap]
  )

  const isDetectedGroupTask = useMemo(() => {
    if (!selectedTugas) return false
    const text = `${selectedTugas.judul || ''} ${selectedTugas.deskripsi || ''}`.toLowerCase()
    return text.includes('kelompok')
  }, [selectedTugas])

  const fetchTugasOptions = async () => {
    const { data, error } = await tugasService.getAll({ per_page: 'all' })
    if (data?.data) {
      const map = {}
      const options = data.data.map(tugas => {
        map[String(tugas.id)] = tugas
        return {
          value: String(tugas.id),
          label: tugas.judul || `Tugas #${tugas.id}`
        }
      })
      setTugasMap(map)
      setTugasOptions(options)
    }
  }

  const fetchSiswaOptions = async () => {
    const { data, error } = await siswaService.getAll({ per_page: 'all' })
    if (data?.data) {
      const options = data.data.map(siswa => ({
        value: String(siswa.id),
        label: `${siswa.nis ? siswa.nis + ' - ' : ''}${siswa.nama || siswa.name || `Siswa #${siswa.id}`}`
      }))
      setSiswaOptions(options)
    }
  }

  const fetchTugasSiswa = async () => {
    setFetchingData(true)
    const { data, error } = await tugasSiswaService.getById(id)
    if (data) {
      const ts = data.data
      if (ts.siswa) {
        setSelectedSiswaLabel(`${ts.siswa.nis ? ts.siswa.nis + ' - ' : ''}${ts.siswa.nama || ts.siswa.name || `Siswa #${ts.siswa.id}`}`)
      }
      // Format datetime for datetime-local input
      let waktuKumpl = ''
      if (ts.waktu_kumpul || ts.waktu_kumpl) {
        const dt = new Date(ts.waktu_kumpul || ts.waktu_kumpl)
        waktuKumpl = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      }
      const groupMembers = getGroupMembers(ts)
      const rawMemberIds = Array.isArray(ts.anggota_kelompok_ids)
        ? ts.anggota_kelompok_ids.map(String)
        : groupMembers.map((m) => String(m.id)).filter(Boolean)
      const ownerId = String(ts.siswa_id ?? ts.siswa?.id ?? ts.mst_siswa_id ?? '')
      const peerMemberIds = rawMemberIds.filter((mId) => mId && mId !== ownerId)

      setFormData({
        mst_tugas_id: String(ts.tugas_id ?? ts.tugas?.id ?? ts.mst_tugas_id ?? ''),
        mst_siswa_id: ownerId,
        jawaban_teks: ts.jawaban_teks || ts.jawaban || '',
        file_siswa: ts.file_jawaban ?? ts.file_siswa ?? ts.file_path ?? '',
        link_tugas: getSubmissionLink(ts) || '',
        is_kelompok: isGroupSubmission(ts),
        nama_kelompok: ts.nama_kelompok || ts.metadata?.nama_kelompok || '',
        anggota_kelompok_ids: peerMemberIds,
        perlu_revisi: isRevisionRequested(ts),
        waktu_kumpul: waktuKumpl,
        status_kumpul: (() => {
          const status = ts.status ?? ts.status_kumpul ?? ts.status_kumpl
          return status !== null && status !== undefined ? String(status) : ''
        })(),
        nilai: isSubmissionGraded(ts) ? String(getSubmissionScore(ts)) : '',
        catatan_guru: ts.catatan_guru || ts.catatan || ''
      })
      setOriginalNilai(isSubmissionGraded(ts) ? String(getSubmissionScore(ts)) : '')
    } else {
      showError('Gagal mengambil data tugas siswa')
      navigate('/akademik/tugas-siswa')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_tugas_id) newErrors.mst_tugas_id = 'Tugas wajib dipilih'
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (canGrade && formData.nilai !== originalNilai && (formData.nilai === '' || !Number.isFinite(Number(formData.nilai)) || Number(formData.nilai) < 0 || Number(formData.nilai) > 100)) {
      newErrors.nilai = 'Nilai harus berupa angka 0–100; nilai tersimpan tidak dapat dikosongkan'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddGroupMember = (e) => {
    const val = e.target ? e.target.value : e
    if (!val) return
    const strVal = String(val)
    if (strVal === String(formData.mst_siswa_id)) return
    setFormData(prev => {
      if (prev.anggota_kelompok_ids.includes(strVal)) return prev
      return {
        ...prev,
        anggota_kelompok_ids: [...prev.anggota_kelompok_ids, strVal],
      }
    })
    setMemberSelectValue('')
  }

  const handleRemoveGroupMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      anggota_kelompok_ids: prev.anggota_kelompok_ids.filter(idVal => idVal !== String(memberId)),
    }))
  }

  const availableMemberOptions = useMemo(() => {
    const excluded = new Set([
      String(formData.mst_siswa_id),
      ...formData.anggota_kelompok_ids.map(String),
    ])
    return siswaOptions.filter(opt => !excluded.has(String(opt.value)))
  }, [siswaOptions, formData.mst_siswa_id, formData.anggota_kelompok_ids])

  const getSiswaLabelById = (siswaId) => {
    const found = siswaOptions.find(opt => String(opt.value) === String(siswaId))
    return found ? found.label : `Siswa #${siswaId}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const effectiveWaktuKumpul = formData.waktu_kumpul
      ? new Date(formData.waktu_kumpul).toISOString()
      : isSiswa
      ? new Date().toISOString()
      : null

    const submitData = {
      mst_tugas_id: parseInt(formData.mst_tugas_id),
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      jawaban_teks: formData.jawaban_teks || null,
      file_siswa: formData.file_siswa || null,
      link_tugas: formData.link_tugas?.trim() || null,
      nama_kelompok: formData.is_kelompok ? (formData.nama_kelompok?.trim() || null) : null,
      anggota_kelompok_ids: formData.is_kelompok
        ? formData.anggota_kelompok_ids.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n))
        : [],
      waktu_kumpul: effectiveWaktuKumpul,
      status_kumpul: formData.status_kumpul !== '' ? parseInt(formData.status_kumpul) : null,
      catatan_guru: formData.catatan_guru || null
    }

    let result
    
    if (isEditMode) {
      result = await tugasSiswaService.update(id, submitData)
    } else {
      result = await tugasSiswaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      if (isEditMode && canGrade && formData.nilai !== originalNilai) {
        const { error: gradeError } = await tugasSiswaService.nilai(id, {
          nilai: Number(formData.nilai), catatan_guru: formData.catatan_guru || null,
        })
        if (gradeError) {
          setErrors(gradeError.errors || {})
          showError('Data pengumpulan tersimpan, tetapi nilai gagal disimpan. Periksa nilai lalu coba simpan kembali.')
          setLoading(false)
          return
        }
        setOriginalNilai(formData.nilai)
      }
      showSuccess(`Tugas siswa berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/tugas-siswa')
    } else {
      console.error(error)
      if (error.errors) {
        const mapped = { ...error.errors }
        if (mapped.tugas_id && !mapped.mst_tugas_id) mapped.mst_tugas_id = mapped.tugas_id
        if (mapped.siswa_id && !mapped.mst_siswa_id) mapped.mst_siswa_id = mapped.siswa_id
        setErrors(mapped)
        const firstMsg = Object.values(mapped).flat()[0]
        if (firstMsg) showError(Array.isArray(firstMsg) ? firstMsg[0] : firstMsg)
      } else {
        showError(error.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tugas siswa`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/tugas-siswa')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tugas Siswa' : 'Tambah Pengumpulan Tugas'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isEditMode && formData.perlu_revisi && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <RotateCcw className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Guru Meminta Revisi / Pengumpulan Ulang
                  </p>
                  {formData.catatan_guru && (
                    <p className="text-amber-800 dark:text-amber-300">
                      <span className="font-medium">Catatan Guru:</span> {formData.catatan_guru}
                    </p>
                  )}
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Silakan perbarui jawaban, berkas, atau tautan tugas Anda lalu klik Simpan untuk mengumpulkan ulang.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tugas <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_tugas_id"
                  value={formData.mst_tugas_id}
                  onChange={handleChange}
                  options={tugasOptions}
                  placeholder="Pilih tugas"
                  error={errors.mst_tugas_id}
                />
                {isDetectedGroupTask && !formData.is_kelompok && (
                  <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Users size={13} />
                    <span>
                      Tugas ini terdeteksi sebagai tugas kelompok. Aktifkan opsi{' '}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_kelompok: true }))}
                        className="font-semibold underline hover:text-indigo-800"
                      >
                        Pengumpulan Kelompok
                      </button>{' '}
                      jika dikerjakan bersama teman.
                    </span>
                  </p>
                )}
              </div>

              {/* Siswa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                {isSiswa ? (
                  <Input
                    type="text"
                    value={selectedSiswaLabel || authSiswaLabel}
                    disabled
                    readOnly
                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-700 dark:text-gray-300"
                  />
                ) : (
                  <SearchableSelect
                    name="mst_siswa_id"
                    value={formData.mst_siswa_id}
                    onChange={handleChange}
                    options={siswaOptions}
                    placeholder="Pilih siswa"
                    error={errors.mst_siswa_id}
                  />
                )}
              </div>

              {/* Mode Tugas Kelompok */}
              <div className="md:col-span-2 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_kelompok}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, is_kelompok: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1.5">
                      <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                      Kumpulkan sebagai Tugas Kelompok
                    </span>
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Seluruh anggota yang dipilih otomatis tercatat sudah mengumpulkan tugas
                  </span>
                </div>

                {formData.is_kelompok && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nama Kelompok
                      </label>
                      <Input
                        type="text"
                        name="nama_kelompok"
                        value={formData.nama_kelompok}
                        onChange={handleChange}
                        placeholder="Contoh: Kelompok 1 - Sosiologi"
                        error={errors.nama_kelompok}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tambah Anggota Kelompok (Rekan Sekelas)
                      </label>
                      <SearchableSelect
                        name="member_picker"
                        value={memberSelectValue}
                        onChange={handleAddGroupMember}
                        options={availableMemberOptions}
                        placeholder="Cari & pilih teman kelompok..."
                      />
                    </div>

                    {formData.anggota_kelompok_ids.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Anggota Kelompok Terpilih ({formData.anggota_kelompok_ids.length} rekan):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.anggota_kelompok_ids.map((mId) => (
                            <span
                              key={mId}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                            >
                              <span>{getSiswaLabelById(mId)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGroupMember(mId)}
                                className="text-gray-400 hover:text-rose-600 transition-colors"
                                title="Hapus anggota"
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Jawaban */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jawaban
                </label>
                <textarea
                  name="jawaban_teks"
                  value={formData.jawaban_teks}
                  onChange={handleChange}
                  placeholder="Masukkan jawaban siswa"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.jawaban_teks && (
                  <p className="mt-1 text-sm text-red-500">{errors.jawaban_teks}</p>
                )}
              </div>

              {/* Tautan / Link Tugas Eksternal */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Link2 size={15} className="text-primary-600" />
                    <span>Tautan / Link Tugas Eksternal (Opsional)</span>
                  </span>
                </label>
                <Input
                  type="url"
                  name="link_tugas"
                  value={formData.link_tugas}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/... atau Canva / YouTube / GitHub"
                  error={errors.link_tugas}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Gunakan jika tugas berupa link Google Drive, Google Docs, Canva, Video YouTube, atau repositori kode.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <FileUpload
                  label="Upload File"
                  accept="image/*,application/pdf,.doc,.docx"
                  maxSize={10 * 1024 * 1024}
                  folder="tugas"
                  previewUrl={formData.file_siswa}
                  onUpload={(path) => {
                    setFormData(prev => ({ ...prev, file_siswa: path || '' }))
                    if (errors.file_siswa) {
                      setErrors(prev => ({ ...prev, file_siswa: null }))
                    }
                  }}
                  error={errors.file_siswa}
                />
              </div>

              {/* Tanggal Kumpul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Kumpul
                </label>
                <input
                  type="datetime-local"
                  name="waktu_kumpul"
                  value={formData.waktu_kumpul}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                {errors.waktu_kumpul && (
                  <p className="mt-1 text-sm text-red-500">{errors.waktu_kumpul}</p>
                )}
              </div>

              {/* Status Kumpul */}
              {!isSiswa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status Kumpul
                  </label>
                  <SearchableSelect
                    name="status_kumpul"
                    value={formData.status_kumpul}
                    onChange={handleChange}
                    options={STATUS_KUMPUL_OPTIONS}
                    placeholder="Pilih status"
                    error={errors.status_kumpul}
                  />
                </div>
              )}

              {/* Nilai - only shown in edit mode */}
              {isEditMode && canGrade && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nilai (0-100)
                  </label>
                  <Input
                    type="number"
                    name="nilai"
                    value={formData.nilai}
                    onChange={handleChange}
                    placeholder="Masukkan nilai"
                    min="0"
                    max="100"
                    error={errors.nilai}
                  />
                </div>
              )}

              {/* Catatan */}
              {!isSiswa && (
                <div className={isEditMode ? '' : 'md:col-span-2'}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catatan Guru
                  </label>
                  <textarea
                    name="catatan_guru"
                    value={formData.catatan_guru}
                    onChange={handleChange}
                    placeholder="Catatan dari guru (opsional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                  />
                  {errors.catatan_guru && (
                    <p className="mt-1 text-sm text-red-500">{errors.catatan_guru}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/tugas-siswa')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'tugas-siswa.update' : 'tugas-siswa.create'}>
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
}

export default TugasSiswaForm