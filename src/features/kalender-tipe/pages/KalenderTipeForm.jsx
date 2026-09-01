import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { kalenderTipeService } from '../services/kalenderTipeService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const KalenderTipeForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    warna: '#3b82f6',
    keterangan: '',
    is_libur: false,
    is_ujian: false,
    is_penting: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    // No show endpoint, fetch from list and find by id
    const { data, error } = await kalenderTipeService.getAll({ per_page: 999 })
    if (data?.data) {
      const item = data.data.find(t => String(t.id) === String(id))
      if (item) {
        setFormData({
          kode: item.kode || '',
          nama: item.nama || '',
          warna: item.warna || '#3b82f6',
          keterangan: item.keterangan || '',
          is_libur: Boolean(item.is_libur),
          is_ujian: Boolean(item.is_ujian),
          is_penting: Boolean(item.is_penting),
        })
      } else {
        showError('Data tidak ditemukan')
        navigate('/admin/kalender-tipe')
      }
    } else {
      showError('Gagal mengambil data')
      navigate('/admin/kalender-tipe')
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
    if (!formData.kode.trim()) errs.kode = 'Kode wajib diisi'
    if (!formData.nama.trim()) errs.nama = 'Nama wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = { ...formData }
    const { data, error } = isEdit
      ? await kalenderTipeService.update(id, payload)
      : await kalenderTipeService.create(payload)
    if (data) {
      showSuccess(`Tipe kalender berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/kalender-tipe')
    } else {
      if (error?.errors) setErrors(error.errors)
      else showError(error?.message || 'Gagal menyimpan data')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/kalender-tipe')}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit' : 'Tambah'} Tipe Kalender</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Kode *" name="kode" value={formData.kode} onChange={handleChange} error={errors.kode} placeholder="Contoh: LIBUR" disabled={isEdit} />
            <Input label="Nama *" name="nama" value={formData.nama} onChange={handleChange} error={errors.nama} placeholder="Contoh: Hari Libur" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warna</label>
              <div className="flex items-center gap-3">
                <input type="color" name="warna" value={formData.warna} onChange={handleChange}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
                <input type="text" name="warna" value={formData.warna} onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" placeholder="#3b82f6" />
              </div>
            </div>
            <Input label="Keterangan" name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Keterangan tambahan" />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_libur" checked={formData.is_libur} onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Hari Libur</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_ujian" checked={formData.is_ujian} onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ujian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_penting" checked={formData.is_penting} onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Penting</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/kalender-tipe')}>Batal</Button>
            <PermissionGuard permission="kalender-tipe.manage">
              <Button type="submit" disabled={saving}><Save size={18} className="mr-2" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default KalenderTipeForm
