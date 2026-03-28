import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { permissionService } from '../services/rolesService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const PermissionsForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    module: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchPermission()
    }
  }, [id])

  const fetchPermission = async () => {
    setFetchingData(true)
    const { data, error } = await permissionService.getById(id)
    if (data) {
      const permission = data.data
      setFormData({
        name: permission.name || '',
        code: permission.code || '',
        module: permission.module || '',
      })
    } else {
      showError('Gagal mengambil data permission')
      navigate('/admin/permissions')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-populate code from name in create mode (user can override)
      if (name === 'name' && !isEditMode && !prev._codeTouched) {
        const autoCode = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        updated.code = autoCode
      }
      if (name === 'code') {
        updated._codeTouched = true
      }
      return updated
    })
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Nama permission wajib diisi'
    if (!isEditMode && !formData.code.trim()) newErrors.code = 'Code permission wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      name: formData.name,
      ...(formData.code.trim() && { code: formData.code.trim() }),
      ...(formData.module.trim() && { module: formData.module.trim() }),
    }

    let result
    if (isEditMode) {
      result = await permissionService.update(id, submitData)
    } else {
      result = await permissionService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Permission berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/permissions')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} permission`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/permissions')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Permission' : 'Tambah Permission Baru'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Permission <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="contoh: Lihat Data Siswa"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code Permission {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="contoh: siswa.view"
                  error={errors.code}
                  disabled={isEditMode}
                />
                {!isEditMode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Format: {'{modul}.{aksi}'}, contoh: <code>siswa.view</code>, <code>ujian.create</code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modul
                </label>
                <Input
                  type="text"
                  name="module"
                  value={formData.module}
                  onChange={handleChange}
                  placeholder="contoh: siswa"
                  error={errors.module}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nama modul untuk pengelompokan, contoh: <code>siswa</code>, <code>ujian</code>
                </p>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/permissions')}>
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

export default PermissionsForm