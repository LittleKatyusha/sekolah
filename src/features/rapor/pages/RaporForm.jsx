import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { raporService } from '../services/raporService'
import { siswaService } from '../../siswa/services/siswaService'
import { mapelService } from '../../mapel/services/mapelService'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { apiService } from '../../../utils/api'

const RaporForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { options: semesterOptions } = useReferenceOptions('kategori_semester', [
    { value: '1', label: 'Ganjil' },
    { value: '2', label: 'Genap' },
  ])

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    semester: '',
    tahun_ajaran_id: '',
    catatan_wali: '',
    sakit: '',
    izin: '',
    tanpa_keterangan: '',
  })

  const [details, setDetails] = useState([])
  const [errors, setErrors] = useState({})
  const [siswaOptions, setSiswaOptions] = useState([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])
  const [mapelOptions, setMapelOptions] = useState([])

  useEffect(() => {
    fetchDropdownOptions()
    if (isEditMode) {
      fetchRapor()
    }
  }, [id])

  const fetchDropdownOptions = async () => {
    // Fetch siswa
    const siswaResult = await siswaService.getAll({ per_page: 200 })
    const siswaList = siswaResult.data?.data || []
    setSiswaOptions(siswaList.map(s => ({
      value: String(s.id),
      label: `${s.nis || ''} - ${s.nama}`
    })))

    // Fetch tahun ajaran
    const tahunResult = await apiService.get('/admin/tahun-ajaran/')
    const tahunList = tahunResult.data?.data || []
    setTahunAjaranOptions(tahunList.map(t => ({
      value: String(t.id),
      label: t.nama || t.tahun_ajaran || `${t.id}`
    })))

    // Fetch mapel for details
    const mapelResult = await mapelService.getMapel({ per_page: 200 })
    const mapelList = mapelResult.data?.data || []
    setMapelOptions(mapelList.map(m => ({
      value: String(m.id),
      label: `${m.kode || ''} - ${m.nama}`
    })))
  }

  const fetchRapor = async () => {
    setFetchingData(true)
    const { data, error } = await raporService.getById(id)
    if (data) {
      const rapor = data.data
      setFormData({
        mst_siswa_id: rapor.siswa?.id ? String(rapor.siswa.id) : '',
        semester: rapor.semester ? String(rapor.semester) : '',
        tahun_ajaran_id: rapor.tahun_ajaran_id ? String(rapor.tahun_ajaran_id) : '',
        catatan_wali: rapor.catatan_wali || '',
        sakit: rapor.kehadiran?.sakit !== null && rapor.kehadiran?.sakit !== undefined ? String(rapor.kehadiran.sakit) : '',
        izin: rapor.kehadiran?.izin !== null && rapor.kehadiran?.izin !== undefined ? String(rapor.kehadiran.izin) : '',
        tanpa_keterangan: rapor.kehadiran?.tanpa_keterangan !== null && rapor.kehadiran?.tanpa_keterangan !== undefined ? String(rapor.kehadiran.tanpa_keterangan) : '',
      })

      if (rapor.detail && Array.isArray(rapor.detail)) {
        setDetails(rapor.detail.map(d => ({
          mst_mapel_id: d.mapel?.id ? String(d.mapel.id) : '',
          nilai_pengetahuan: d.nilai_pengetahuan !== null && d.nilai_pengetahuan !== undefined ? String(d.nilai_pengetahuan) : '',
          nilai_keterampilan: d.nilai_keterampilan !== null && d.nilai_keterampilan !== undefined ? String(d.nilai_keterampilan) : '',
          nilai_akhir: d.nilai_akhir !== null && d.nilai_akhir !== undefined ? String(d.nilai_akhir) : '',
          predikat: d.predikat || '',
          deskripsi: d.deskripsi || '',
        })))
      }
    } else {
      showError('Gagal mengambil data rapor')
      navigate('/akademik/rapor')
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

  const handleDetailChange = (index, field, value) => {
    setDetails(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addDetail = () => {
    setDetails(prev => [...prev, {
      mst_mapel_id: '',
      nilai_pengetahuan: '',
      nilai_keterampilan: '',
      nilai_akhir: '',
      predikat: '',
      deskripsi: '',
    }])
  }

  const removeDetail = (index) => {
    setDetails(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (!formData.semester) newErrors.semester = 'Semester wajib dipilih'
    if (!formData.tahun_ajaran_id) newErrors.tahun_ajaran_id = 'Tahun ajaran wajib dipilih'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      semester: formData.semester,
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      catatan_wali: formData.catatan_wali || null,
      sakit: formData.sakit !== '' ? parseInt(formData.sakit) : null,
      izin: formData.izin !== '' ? parseInt(formData.izin) : null,
      tanpa_keterangan: formData.tanpa_keterangan !== '' ? parseInt(formData.tanpa_keterangan) : null,
    }

    // Only include details on create
    if (!isEditMode && details.length > 0) {
      submitData.details = details
        .filter(d => d.mst_mapel_id)
        .map(d => ({
          mst_mapel_id: parseInt(d.mst_mapel_id),
          nilai_pengetahuan: d.nilai_pengetahuan !== '' ? parseFloat(d.nilai_pengetahuan) : 0,
          nilai_keterampilan: d.nilai_keterampilan !== '' ? parseFloat(d.nilai_keterampilan) : null,
          nilai_akhir: d.nilai_akhir !== '' ? parseFloat(d.nilai_akhir) : null,
          predikat: d.predikat || null,
          deskripsi: d.deskripsi || null,
        }))
    }

    let result
    if (isEditMode) {
      result = await raporService.update(id, submitData)
    } else {
      result = await raporService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Rapor berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/rapor')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} rapor`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/rapor')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Rapor' : 'Tambah Rapor Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  options={siswaOptions}
                  placeholder="Pilih siswa"
                  error={errors.mst_siswa_id}
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  options={semesterOptions}
                  placeholder="Pilih semester"
                  error={errors.semester}
                />
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tahun_ajaran_id"
                  value={formData.tahun_ajaran_id}
                  onChange={handleChange}
                  options={tahunAjaranOptions}
                  placeholder="Pilih tahun ajaran"
                  error={errors.tahun_ajaran_id}
                />
              </div>

              {/* Catatan Wali */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Wali Kelas
                </label>
                <textarea
                  name="catatan_wali"
                  value={formData.catatan_wali}
                  onChange={handleChange}
                  placeholder="Masukkan catatan wali kelas"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.catatan_wali && (
                  <p className="mt-1 text-sm text-red-500">{errors.catatan_wali}</p>
                )}
              </div>

              {/* Kehadiran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sakit (hari)
                </label>
                <Input
                  type="number"
                  name="sakit"
                  value={formData.sakit}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  error={errors.sakit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Izin (hari)
                </label>
                <Input
                  type="number"
                  name="izin"
                  value={formData.izin}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  error={errors.izin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanpa Keterangan (hari)
                </label>
                <Input
                  type="number"
                  name="tanpa_keterangan"
                  value={formData.tanpa_keterangan}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  error={errors.tanpa_keterangan}
                />
              </div>
            </div>

            {/* Detail Nilai (only on create) */}
            {!isEditMode && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Nilai per Mapel</h3>
                  <Button type="button" variant="secondary" onClick={addDetail}>
                    <Plus size={16} className="mr-1" />
                    Tambah Mapel
                  </Button>
                </div>

                {details.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada detail nilai. Klik "Tambah Mapel" untuk menambahkan.</p>
                ) : (
                  <div className="space-y-4">
                    {details.map((detail, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapel #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mata Pelajaran</label>
                            <SearchableSelect
                              name={`detail_mapel_${index}`}
                              value={detail.mst_mapel_id}
                              onChange={(e) => handleDetailChange(index, 'mst_mapel_id', e.target.value)}
                              options={mapelOptions}
                              placeholder="Pilih mapel"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nilai Pengetahuan</label>
                            <Input
                              type="number"
                              value={detail.nilai_pengetahuan}
                              onChange={(e) => handleDetailChange(index, 'nilai_pengetahuan', e.target.value)}
                              placeholder="0-100"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nilai Keterampilan</label>
                            <Input
                              type="number"
                              value={detail.nilai_keterampilan}
                              onChange={(e) => handleDetailChange(index, 'nilai_keterampilan', e.target.value)}
                              placeholder="0-100"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nilai Akhir</label>
                            <Input
                              type="number"
                              value={detail.nilai_akhir}
                              onChange={(e) => handleDetailChange(index, 'nilai_akhir', e.target.value)}
                              placeholder="0-100"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Predikat</label>
                            <Input
                              type="text"
                              value={detail.predikat}
                              onChange={(e) => handleDetailChange(index, 'predikat', e.target.value)}
                              placeholder="A/B/C/D"
                              maxLength={2}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
                            <Input
                              type="text"
                              value={detail.deskripsi}
                              onChange={(e) => handleDetailChange(index, 'deskripsi', e.target.value)}
                              placeholder="Deskripsi nilai"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/rapor')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save size={18} className="mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default RaporForm