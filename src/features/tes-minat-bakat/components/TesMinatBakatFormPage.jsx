import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { normalizeIn, normalizeOut, tesMinatBakatResources } from '../config.jsx'
import tesMinatBakatService from '../services/tesMinatBakatService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const createEmptyFormData = (fields) => fields.reduce((accumulator, field) => {
  accumulator[field.name] = field.type === 'checkbox' ? false : ''
  return accumulator
}, {})

const createEmptyOpsi = (fallbackAspekId = '') => ({
  label: '',
  teks_opsi: '',
  skor: '',
  urutan: '',
  mst_tes_minat_bakat_aspek_id: fallbackAspekId || '',
})

const getFieldError = (errors, name) => {
  const value = errors[name]
  if (Array.isArray(value)) return value[0]
  return value || null
}

const TesMinatBakatFormPage = ({ resourceKey }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const resource = tesMinatBakatResources[resourceKey]
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState(() => ({
    ...createEmptyFormData(resource.fields),
    ...(resourceKey === 'pertanyaan' ? { opsi: [] } : {}),
  }))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState({})

  useEffect(() => {
    const loadOptions = async () => {
      if (!resource.optionLoaders) return

      const entries = await Promise.all(
        Object.entries(resource.optionLoaders).map(async ([key, loader]) => {
          try {
            return [key, await loader()]
          } catch (error) {
            console.error(`Failed to load options for ${resourceKey}.${key}:`, error)
            return [key, []]
          }
        })
      )

      setOptions(Object.fromEntries(entries))
    }

    loadOptions()
  }, [resource, resourceKey])

  useEffect(() => {
    const loadDependentOptions = async () => {
      if (resourceKey === 'jawaban') {
        if (!formData.trx_tes_minat_bakat_peserta_id) {
          setOptions((previous) => ({ ...previous, pertanyaan: [], opsi: [] }))
          return
        }

        const { data: pesertaResponse, error: pesertaError } = await tesMinatBakatService.peserta.getById(formData.trx_tes_minat_bakat_peserta_id)
        const tesId = pesertaResponse?.data?.trx_tes_minat_bakat_id

        if (pesertaError || !tesId) {
          setOptions((previous) => ({ ...previous, pertanyaan: [], opsi: [] }))
          return
        }

        const { data: pertanyaanResponse, error: pertanyaanError } = await tesMinatBakatService.pertanyaan.getByTes(tesId)
        const pertanyaanOptions = pertanyaanError
          ? []
          : (Array.isArray(pertanyaanResponse?.data?.data) ? pertanyaanResponse.data.data : Array.isArray(pertanyaanResponse?.data) ? pertanyaanResponse.data : []).map((item) => ({
              value: item.id,
              label: `${item.urutan || '-'} - ${String(item.pertanyaan || '').slice(0, 80)}`,
            }))

        let opsiOptions = []
        if (formData.mst_tes_minat_bakat_pertanyaan_id) {
          const { data: detailResponse, error: detailError } = await tesMinatBakatService.pertanyaan.getById(formData.mst_tes_minat_bakat_pertanyaan_id)
          opsiOptions = detailError
            ? []
            : (detailResponse?.data?.opsi || []).map((item) => ({
                value: item.id,
                label: [item.label, item.teks_opsi].filter(Boolean).join(' - ') || `Opsi #${item.id}`,
              }))
        }

        setOptions((previous) => ({
          ...previous,
          pertanyaan: pertanyaanOptions,
          opsi: opsiOptions,
        }))
      }
    }

    loadDependentOptions()
  }, [formData.mst_tes_minat_bakat_pertanyaan_id, formData.trx_tes_minat_bakat_peserta_id, resourceKey])

  useEffect(() => {
    if (!isEditMode) return

    const loadRecord = async () => {
      setFetching(true)
      const { data, error } = await resource.service.getById(id)

      if (error || !data?.data) {
        showError(`Gagal mengambil data ${resource.navTitle.toLowerCase()}`)
        navigate(resource.basePath)
        setFetching(false)
        return
      }

      setFormData(normalizeIn(resourceKey, data.data))
      setFetching(false)
    }

    loadRecord()
  }, [id, isEditMode, navigate, resource, resourceKey])

  const title = useMemo(() => (
    isEditMode ? `Edit ${resource.navTitle}` : `Tambah ${resource.navTitle}`
  ), [isEditMode, resource.navTitle])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((previous) => {
      const nextState = { ...previous, [name]: type === 'checkbox' ? checked : value }

      if (resourceKey === 'peserta' && name === 'trx_tes_minat_bakat_id') {
        nextState.mst_siswa_id = ''
      }

      if (resourceKey === 'jawaban' && name === 'trx_tes_minat_bakat_peserta_id') {
        nextState.mst_tes_minat_bakat_pertanyaan_id = ''
        nextState.mst_tes_minat_bakat_opsi_id = ''
      }

      if (resourceKey === 'jawaban' && name === 'mst_tes_minat_bakat_pertanyaan_id') {
        nextState.mst_tes_minat_bakat_opsi_id = ''
      }

      if (resourceKey === 'pertanyaan' && name === 'mst_tes_minat_bakat_aspek_id') {
        nextState.opsi = Array.isArray(previous.opsi)
          ? previous.opsi.map((opsi) => ({
              ...opsi,
              mst_tes_minat_bakat_aspek_id: opsi.mst_tes_minat_bakat_aspek_id || value,
            }))
          : []
      }

      return nextState
    })

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: null }))
    }
  }

  const handleOpsiChange = (index, key, value) => {
    setFormData((previous) => ({
      ...previous,
      opsi: previous.opsi.map((opsi, opsiIndex) => (
        opsiIndex === index ? { ...opsi, [key]: value } : opsi
      )),
    }))

    const errorKey = `opsi.${index}.${key}`
    if (errors[errorKey]) {
      setErrors((previous) => ({ ...previous, [errorKey]: null }))
    }
  }

  const handleAddOpsi = () => {
    setFormData((previous) => ({
      ...previous,
      opsi: [...(previous.opsi || []), createEmptyOpsi(previous.mst_tes_minat_bakat_aspek_id)],
    }))
  }

  const handleRemoveOpsi = (index) => {
    setFormData((previous) => ({
      ...previous,
      opsi: previous.opsi.filter((_, opsiIndex) => opsiIndex !== index),
    }))
  }

  const validate = () => {
    const validationErrors = {}

    resource.fields.forEach((field) => {
      if (!field.required) return

      const value = formData[field.name]
      const isEmpty = field.type === 'checkbox' ? false : value === '' || value === null || typeof value === 'undefined'
      if (isEmpty) {
        validationErrors[field.name] = `${field.label} wajib diisi`
      }
    })

    if (resourceKey === 'pertanyaan' && Array.isArray(formData.opsi)) {
      formData.opsi.forEach((opsi, index) => {
        const hasAnyValue = [opsi.label, opsi.teks_opsi, opsi.skor, opsi.urutan].some((value) => value !== '' && value !== null && typeof value !== 'undefined')

        if (!hasAnyValue) return

        if (!opsi.label) validationErrors[`opsi.${index}.label`] = 'Label opsi wajib diisi'
        if (!opsi.teks_opsi) validationErrors[`opsi.${index}.teks_opsi`] = 'Teks opsi wajib diisi'
        if (opsi.skor === '' || opsi.skor === null || typeof opsi.skor === 'undefined') validationErrors[`opsi.${index}.skor`] = 'Skor opsi wajib diisi'
      })
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)

    const payload = normalizeOut(resourceKey, formData)

    if (resourceKey === 'pertanyaan') {
      if (!isEditMode && Array.isArray(payload.opsi) && payload.opsi.length === 0) {
        delete payload.opsi
      }
    }

    const result = isEditMode
      ? await resource.service.update(id, payload)
      : await resource.service.create(payload)

    if (result.error) {
      if (result.error.errors) {
        setErrors(result.error.errors)
      } else {
        showError(`Gagal menyimpan ${resource.navTitle.toLowerCase()}`)
      }
      setLoading(false)
      return
    }

    showSuccess(`${resource.navTitle} berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}`)
    navigate(resource.basePath)
  }

  const renderField = (field) => {
    if (field.type === 'select') {
      const selectOptions = field.options || options[field.optionsKey] || []
      const isDisabled = field.optionsKey === 'pertanyaan' && resourceKey === 'jawaban' && !formData.trx_tes_minat_bakat_peserta_id
          ? true
          : field.optionsKey === 'opsi' && resourceKey === 'jawaban' && !formData.mst_tes_minat_bakat_pertanyaan_id
            ? true
            : false

      return (
        <div className={field.span === 2 ? 'md:col-span-2' : ''} key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : null}
          </label>
          <SearchableSelect
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            options={selectOptions}
            placeholder={field.placeholder || `Pilih ${field.label}`}
            disabled={isDisabled}
            error={errors[field.name]}
          />
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div className={field.span === 2 ? 'md:col-span-2' : ''} key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : null}
          </label>
          <textarea
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            rows={field.rows || 3}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          {errors[field.name] ? (
            <p className="mt-1 text-sm text-red-500">{Array.isArray(errors[field.name]) ? errors[field.name][0] : errors[field.name]}</p>
          ) : null}
        </div>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.name} className={`flex items-center gap-3 ${field.span === 2 ? 'md:col-span-2' : ''}`}>
          <input
            type="checkbox"
            name={field.name}
            checked={Boolean(formData[field.name])}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
        </label>
      )
    }

    return (
      <div className={field.span === 2 ? 'md:col-span-2' : ''} key={field.name}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label}
          {field.required ? <span className="text-red-500"> *</span> : null}
        </label>
        <Input
          type={field.type || 'text'}
          name={field.name}
          value={formData[field.name]}
          onChange={handleChange}
          placeholder={field.placeholder}
          error={errors[field.name]}
        />
      </div>
    )
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate(resource.basePath)}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resource.fields.map(renderField)}
          </div>

          {resourceKey === 'pertanyaan' ? (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Opsi Jawaban</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Setiap opsi dapat diarahkan ke aspek tertentu atau mengikuti aspek pertanyaan.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleAddOpsi}>
                  Tambah Opsi
                </Button>
              </div>

              <div className="space-y-4">
                {(formData.opsi || []).length > 0 ? (formData.opsi || []).map((opsi, index) => (
                  <div key={opsi.id || index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Opsi {index + 1}</h3>
                      <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveOpsi(index)}>
                        Hapus
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                        <Input
                          type="text"
                          value={opsi.label}
                          onChange={(event) => handleOpsiChange(index, 'label', event.target.value)}
                          placeholder="A"
                          error={getFieldError(errors, `opsi.${index}.label`)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skor</label>
                        <Input
                          type="number"
                          value={opsi.skor}
                          onChange={(event) => handleOpsiChange(index, 'skor', event.target.value)}
                          placeholder="0"
                          error={getFieldError(errors, `opsi.${index}.skor`)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teks Opsi</label>
                        <textarea
                          value={opsi.teks_opsi}
                          onChange={(event) => handleOpsiChange(index, 'teks_opsi', event.target.value)}
                          rows={3}
                          placeholder="Tulis teks opsi jawaban"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                        {getFieldError(errors, `opsi.${index}.teks_opsi`) ? (
                          <p className="mt-1 text-sm text-red-500">{getFieldError(errors, `opsi.${index}.teks_opsi`)}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan</label>
                        <Input
                          type="number"
                          value={opsi.urutan}
                          onChange={(event) => handleOpsiChange(index, 'urutan', event.target.value)}
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aspek Opsi</label>
                        <SearchableSelect
                          name={`opsi.${index}.mst_tes_minat_bakat_aspek_id`}
                          value={opsi.mst_tes_minat_bakat_aspek_id}
                          onChange={(event) => handleOpsiChange(index, 'mst_tes_minat_bakat_aspek_id', event.target.value)}
                          options={options.aspek || []}
                          placeholder="Gunakan aspek pertanyaan atau pilih aspek"
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada opsi jawaban. Tambahkan opsi jika pertanyaan membutuhkan pilihan atau skala penilaian.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate(resource.basePath)}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              <Save size={18} className="mr-2" />
              Simpan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TesMinatBakatFormPage