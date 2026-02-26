import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ujianJawabanService } from '../services/ujianJawabanService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const UjianJawabanForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    trx_ujian_user_id: '',
    mst_soal_id: '',
    mst_soal_opsi_id: '',
    jawaban_teks: '',
    ragu_ragu: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { if (isEdit) fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await ujianJawabanService.getById(id)
    if (data?.data) {
      const d = data.data
      setFormData({
        trx_ujian_user_id: d.trx_ujian_user_id || '',
        mst_soal_id: d.mst_soal_id || '',
        mst_soal_opsi_id: d.mst_soal_opsi_id || '',
        jawaban_teks: d.jawaban_teks || '',
        ragu_ragu: Boolean(d.ragu_ragu),
      })
    } else {
      showError('Gagal mengambil data')
      navigate('/akademik/ujian-jawaban')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.trx_ujian_user_id) errs.trx_ujian_user_id = 'Ujian User ID wajib diisi'
    if (!formData.mst_soal_id) errs.mst_soal_id = 'Soal ID wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = { ...formData }
    const { data, error } = isEdit
      ? await ujianJawabanService.update(id, payload)
      : await ujianJawabanService.create(payload)
    if (data) {
      showSuccess(`Jawaban berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/ujian-jawaban')
    } else {
      if (error?.errors) setErrors(error.errors)
      else showError(error?.message || 'Gagal menyimpan data')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian-jawaban')}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit' : 'Tambah'} Jawaban Ujian</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Ujian User ID *" name="trx_ujian_user_id" type="number" value={formData.trx_ujian_user_id} onChange={handleChange} error={errors.trx_ujian_user_id} placeholder="ID ujian user" />
            <Input label="Soal ID *" name="mst_soal_id" type="number" value={formData.mst_soal_id} onChange={handleChange} error={errors.mst_soal_id} placeholder="ID soal" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Opsi ID" name="mst_soal_opsi_id" type="number" value={formData.mst_soal_opsi_id} onChange={handleChange} error={errors.mst_soal_opsi_id} placeholder="ID opsi jawaban" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jawaban Teks</label>
              <textarea name="jawaban_teks" value={formData.jawaban_teks} onChange={handleChange} rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Jawaban dalam bentuk teks (untuk soal essay)" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="ragu_ragu" checked={formData.ragu_ragu} onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ragu-ragu</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/akademik/ujian-jawaban')}>Batal</Button>
            <Button type="submit" disabled={saving}><Save size={18} className="mr-2" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UjianJawabanForm