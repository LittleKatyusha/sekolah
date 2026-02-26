import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { dokumenService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const DokumenForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    ppdb_pendaftar_id: '',
    jenis_dokumen: '',
    file_name: '',
    mime_type: '',
    file_size: '',
    file_path: '',
    verifikasi_status: '',
    catatan_admin: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) fetchDokumen()
  }, [id])

  const fetchDokumen = async () => {
    setLoading(true)
    const { data, error } = await dokumenService.getById(id)
    if (data) {
      const d = data.data || data
      setFormData({
        ppdb_pendaftar_id: d.ppdb_pendaftar_id || '',
        jenis_dokumen: d.jenis_dokumen || '',
        file_name: d.file_name || '',
        mime_type: d.mime_type || '',
        file_size: d.file_size || '',
        file_path: d.file_path || '',
        verifikasi_status: d.verifikasi_status || '',
        catatan_admin: d.catatan_admin || '',
      })
    } else {
      showError('Gagal mengambil data dokumen')
      navigate('/ppdb/dokumen')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.ppdb_pendaftar_id) newErrors.ppdb_pendaftar_id = 'ID Pendaftar wajib diisi'
    if (!formData.jenis_dokumen) newErrors.jenis_dokumen = 'Jenis dokumen wajib diisi'
    if (!formData.file_name) newErrors.file_name = 'Nama file wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const payload = { ...formData }
    if (payload.file_size) payload.file_size = Number(payload.file_size)

    const { data, error } = isEdit
      ? await dokumenService.update(id, payload)
      : await dokumenService.create(payload)

    if (data) {
      showSuccess(`Dokumen berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/ppdb/dokumen')
    } else {
      if (error?.errors) {
        setErrors(error.errors)
      } else {
        showError(error?.message || 'Gagal menyimpan dokumen')
      }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ppdb/dokumen')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Dokumen' : 'Tambah Dokumen'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="ID Pendaftar *"
              name="ppdb_pendaftar_id"
              type="number"
              value={formData.ppdb_pendaftar_id}
              onChange={handleChange}
              error={errors.ppdb_pendaftar_id}
              placeholder="Masukkan ID pendaftar"
            />
            <Input
              label="Jenis Dokumen *"
              name="jenis_dokumen"
              value={formData.jenis_dokumen}
              onChange={handleChange}
              error={errors.jenis_dokumen}
              placeholder="cth: kartu_keluarga, akte, rapor, ijazah"
            />
            <Input
              label="Nama File *"
              name="file_name"
              value={formData.file_name}
              onChange={handleChange}
              error={errors.file_name}
              placeholder="Masukkan nama file"
            />
            <Input
              label="MIME Type"
              name="mime_type"
              value={formData.mime_type}
              onChange={handleChange}
              error={errors.mime_type}
              placeholder="cth: application/pdf"
            />
            <Input
              label="Ukuran File (bytes)"
              name="file_size"
              type="number"
              value={formData.file_size}
              onChange={handleChange}
              error={errors.file_size}
              placeholder="Masukkan ukuran file"
            />
            <Input
              label="Path File"
              name="file_path"
              value={formData.file_path}
              onChange={handleChange}
              error={errors.file_path}
              placeholder="Masukkan path file"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Verifikasi</label>
              <select
                name="verifikasi_status"
                value={formData.verifikasi_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Pilih Status --</option>
                <option value="pending">Pending</option>
                <option value="verified">Terverifikasi</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan Admin</label>
            <textarea
              name="catatan_admin"
              value={formData.catatan_admin}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Catatan admin (opsional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" type="button" onClick={() => navigate('/ppdb/dokumen')}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={18} className="mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default DokumenForm