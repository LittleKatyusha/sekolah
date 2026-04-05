import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { menuService } from '../services/menuService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const MenuForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [parentMenus, setParentMenus] = useState([])

  const [formData, setFormData] = useState({
    parent_id: '',
    sys_permission_id: '',
    nama_menu: '',
    url: '',
    icon: '',
    urutan: '',
    is_active: 1
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchParentMenus()
    if (isEditMode) fetchMenu()
  }, [id])

  const fetchParentMenus = async () => {
    const { data } = await menuService.getAll({ per_page: 100 })
    if (data) {
      const menus = (data.data || []).filter(m => String(m.id) !== String(id))
      setParentMenus(menus)
    }
  }

  const fetchMenu = async () => {
    setFetchingData(true)
    const { data, error } = await menuService.getById(id)
    if (data) {
      const menu = data.data
      setFormData({
        parent_id: menu.parent_id || '',
        sys_permission_id: menu.sys_permission_id || '',
        nama_menu: menu.nama_menu || '',
        url: menu.url || '',
        icon: menu.icon || '',
        urutan: menu.urutan ?? '',
        is_active: menu.is_active !== undefined ? menu.is_active : 1
      })
    } else {
      showError('Gagal mengambil data menu')
      navigate('/admin/menus')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama_menu) newErrors.nama_menu = 'Nama menu wajib diisi'
    if (formData.nama_menu && formData.nama_menu.length > 100) newErrors.nama_menu = 'Nama menu maksimal 100 karakter'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      ...formData,
      parent_id: formData.parent_id || null,
      sys_permission_id: formData.sys_permission_id || null,
      urutan: formData.urutan !== '' ? Number(formData.urutan) : null,
      is_active: Number(formData.is_active)
    }

    let result
    if (isEditMode) {
      result = await menuService.update(id, submitData)
    } else {
      result = await menuService.create(submitData)
    }

    const { error } = result
    if (!error) {
      showSuccess(`Menu berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/menus')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} menu`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/menus')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Menu' : 'Tambah Menu Baru'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama_menu"
                  value={formData.nama_menu}
                  onChange={handleChange}
                  placeholder="Nama Menu"
                  error={errors.nama_menu}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Menu
                </label>
                <select
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tidak ada (Root Menu)</option>
                  {parentMenus.map(menu => (
                    <option key={menu.id} value={menu.id}>{menu.nama_menu}</option>
                  ))}
                </select>
                {errors.parent_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.parent_id) ? errors.parent_id[0] : errors.parent_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission ID
                </label>
                <Input
                  name="sys_permission_id"
                  type="number"
                  value={formData.sys_permission_id}
                  onChange={handleChange}
                  placeholder="ID Permission (opsional)"
                  error={errors.sys_permission_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <Input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="/path/to/page"
                  error={errors.url}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <Input
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  placeholder="Nama icon (misal: home, users)"
                  error={errors.icon}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urutan
                </label>
                <Input
                  name="urutan"
                  type="number"
                  value={formData.urutan}
                  onChange={handleChange}
                  placeholder="Urutan tampil"
                  error={errors.urutan}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Nonaktif</option>
                </select>
                {errors.is_active && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.is_active) ? errors.is_active[0] : errors.is_active}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/menus')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'menus.edit' : 'menus.create'}>
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

export default MenuForm