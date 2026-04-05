import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Check } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'
import { showSoal, storeSoal, updateSoal } from '../services/soalService'
import { mapelService } from '../../mapel/services/mapelService'
import { ujianService } from '../../ujian/services/ujianService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const SoalForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [selectedMapelOption, setSelectedMapelOption] = useState(null)
  const [selectedUjianOption, setSelectedUjianOption] = useState(null)
  const { options: tipeSoalOptions } = useReferenceOptions('tipe_soal')
  const { options: tingkatKesulitanOptions } = useReferenceOptions('tingkat_kesulitan')
  
  const [formData, setFormData] = useState({
    pertanyaan: '',
    tipe: '',
    tingkat_kesulitan: '',
    mst_mapel_id: '',
    trx_ujian_id: '',
    bobot: 1,
    options: [
      { teks_opsi: '', is_jawaban: false },
      { teks_opsi: '', is_jawaban: false }
    ]
  })

  const [errors, setErrors] = useState({})

  const buildMapelOption = useCallback((mapel) => ({
    value: String(mapel.id),
    label: `${mapel.kode_mapel || mapel.kode || '-'} - ${mapel.nama_mapel || mapel.nama || `Mapel #${mapel.id}`}`
  }), [])

  const buildUjianOption = useCallback((ujian) => ({
    value: String(ujian.id),
    label: ujian.nama || `Ujian #${ujian.id}`
  }), [])

  useEffect(() => {
    if (isEditMode) {
      fetchSoal()
    }
  }, [id])

  const searchMapelOptions = useCallback(async (keyword = '') => {
    try {
      const { data, error } = await mapelService.getMapel({
        search: keyword || undefined,
        per_page: 20
      })

      if (data?.data) {
        return data.data.map(buildMapelOption)
      }

      console.error('Failed to fetch mapel:', error)
      return []
    } catch (err) {
      console.error('Error fetching mapel options:', err)
      return []
    }
  }, [buildMapelOption])

  const searchUjianOptions = useCallback(async (keyword = '') => {
    try {
      const { data, error } = await ujianService.getAll({
        search: keyword || undefined,
        per_page: 20
      })

      if (data?.data) {
        const ujianList = Array.isArray(data.data) ? data.data : (data.data.data || [])
        return ujianList.map(buildUjianOption)
      }

      console.error('Failed to fetch ujian:', error)
      return []
    } catch (err) {
      console.error('Error fetching ujian options:', err)
      return []
    }
  }, [buildUjianOption])

  const fetchSoal = async () => {
    setFetchingData(true)
    const { data, error } = await showSoal(id)
    if (data) {
      const soal = data.data
      const mapelId = soal.mst_mapel_id ? String(soal.mst_mapel_id) : ''
      const ujianId = soal.trx_ujian_id ? String(soal.trx_ujian_id) : ''

      setFormData({
        pertanyaan: soal.pertanyaan || '',
        tipe: soal.tipe || '',
        tingkat_kesulitan: soal.tingkat_kesulitan || '',
        mst_mapel_id: mapelId,
        trx_ujian_id: ujianId,
        bobot: soal.bobot || 1,
        options: soal.opsi?.length > 0
          ? soal.opsi
          : [
              { teks_opsi: '', is_jawaban: false },
              { teks_opsi: '', is_jawaban: false }
            ]
      })

      if (soal.mapel?.id) {
        setSelectedMapelOption(buildMapelOption(soal.mapel))
      }

      if (soal.ujian?.id) {
        setSelectedUjianOption(buildUjianOption(soal.ujian))
      }
    } else {
      showError('Gagal mengambil data soal')
      navigate('/akademik/soals')
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

  const handleMapelChange = (e) => {
    handleChange(e)
  }

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => {
      const newOptions = [...prev.options]
      newOptions[index] = { ...newOptions[index], [field]: value }
      return { ...prev, options: newOptions }
    })
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { teks_opsi: '', is_jawaban: false }]
    }))
  }

  const removeOption = (index) => {
    if (formData.options.length <= 2) return
    
    setFormData(prev => {
      const newOptions = [...prev.options]
      newOptions.splice(index, 1)
      return { ...prev, options: newOptions }
    })
  }

  const toggleJawaban = (index) => {
    setFormData(prev => {
      const newOptions = prev.options.map((option, i) => ({
        ...option,
        is_jawaban: i === index
      }))
      return { ...prev, options: newOptions }
    })
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.pertanyaan.trim()) newErrors.pertanyaan = 'Pertanyaan wajib diisi'
    if (!formData.tipe) newErrors.tipe = 'Tipe soal wajib dipilih'
    if (!formData.tingkat_kesulitan) newErrors.tingkat_kesulitan = 'Tingkat kesulitan wajib dipilih'
    if (!formData.mst_mapel_id) newErrors.mst_mapel_id = 'Mata pelajaran wajib dipilih'
    if (!formData.trx_ujian_id) newErrors.trx_ujian_id = 'Ujian wajib dipilih'
    if (!formData.bobot && formData.bobot !== 0) newErrors.bobot = 'Bobot wajib diisi'
    
    // Validate options only for multiple choice
    if (formData.tipe === '1') {
      formData.options.forEach((option, index) => {
        if (!option.teks_opsi.trim()) {
          newErrors[`option_${index}`] = 'Teks opsi tidak boleh kosong'
        }
      })
      
      const hasJawaban = formData.options.some(opt => opt.is_jawaban)
      if (!hasJawaban) {
        newErrors.options = 'Pilih setidaknya satu jawaban yang benar'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      pertanyaan: formData.pertanyaan,
      tipe: formData.tipe,
      tingkat_kesulitan: formData.tingkat_kesulitan,
      mst_mapel_id: formData.mst_mapel_id,
      trx_ujian_id: formData.trx_ujian_id,
      bobot: formData.bobot,
      options: formData.tipe === '1' ? formData.options : []
    }

    let result
    
    if (isEditMode) {
      result = await updateSoal(id, submitData)
    } else {
      result = await storeSoal(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Soal berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/soals')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} soal`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/soals')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Soal' : 'Tambah Soal Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Pertanyaan */}
              <div>
                <LexicalEditor
                  label="Pertanyaan"
                  required
                  value={formData.pertanyaan}
                  onChange={(html) => setFormData(prev => ({ ...prev, pertanyaan: html }))}
                  placeholder="Tulis pertanyaan..."
                  minHeight="150px"
                />
                {errors.pertanyaan && <p className="mt-1 text-sm text-red-500">{errors.pertanyaan}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tipe Soal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe Soal <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tipe"
                    value={formData.tipe}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih tipe soal</option>
                    {tipeSoalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.tipe && <p className="mt-1 text-sm text-red-500">{errors.tipe}</p>}
                </div>

                {/* Tingkat Kesulitan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tingkat Kesulitan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tingkat_kesulitan"
                    value={formData.tingkat_kesulitan}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih tingkat kesulitan</option>
                    {tingkatKesulitanOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.tingkat_kesulitan && <p className="mt-1 text-sm text-red-500">{errors.tingkat_kesulitan}</p>}
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={selectedMapelOption ? [selectedMapelOption] : []}
                    value={formData.mst_mapel_id}
                    name="mst_mapel_id"
                    onChange={handleMapelChange}
                    loadOptions={searchMapelOptions}
                    placeholder="Pilih mata pelajaran"
                    searchPlaceholder="Cari mata pelajaran..."
                    noOptionsText="Tidak ada mata pelajaran yang cocok"
                    error={errors.mst_mapel_id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ujian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ujian <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={selectedUjianOption ? [selectedUjianOption] : []}
                    value={formData.trx_ujian_id}
                    name="trx_ujian_id"
                    onChange={handleChange}
                    loadOptions={searchUjianOptions}
                    placeholder="Pilih ujian"
                    searchPlaceholder="Cari ujian..."
                    noOptionsText="Tidak ada ujian yang cocok"
                    error={errors.trx_ujian_id}
                  />
                </div>

                {/* Bobot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bobot <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="bobot"
                    value={formData.bobot}
                    onChange={handleChange}
                    placeholder="Masukkan bobot soal"
                    min="0"
                    error={errors.bobot}
                  />
                </div>
              </div>

              {/* Options Section - Only for Multiple Choice */}
              {(formData.tipe === '1' || formData.tipe === 1) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Opsi Jawaban
                    </h3>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus size={16} className="mr-1" />
                      Tambah Opsi
                    </Button>
                  </div>
                  
                  {errors.options && (
                    <p className="mb-3 text-sm text-red-500">{errors.options}</p>
                  )}
                  
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Opsi {index + 1}
                            </span>
                            {errors[`option_${index}`] && (
                              <span className="text-sm text-red-500">
                                {errors[`option_${index}`]}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={option.teks_opsi}
                              onChange={(e) => handleOptionChange(index, 'teks_opsi', e.target.value)}
                              placeholder="Teks opsi"
                              className="flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => toggleJawaban(index)}
                              className={`flex items-center justify-center w-10 h-10 rounded-md border ${
                                option.is_jawaban 
                                  ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              title={option.is_jawaban ? 'Jawaban benar' : 'Tandai sebagai jawaban benar'}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              disabled={formData.options.length <= 2}
                              className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus opsi"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/soals')}>
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

export default SoalForm