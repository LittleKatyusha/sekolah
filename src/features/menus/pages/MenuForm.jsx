import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ChevronDown, Search } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { menuService } from '../services/menuService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { apiService } from '../../../utils/api'

const SearchableSelect = ({ options, value, onChange, name, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedOption = options.find(opt => opt.value === value || opt.value === parseInt(value));

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`w-full flex justify-between items-center rounded-md border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            <div
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 italic"
              onClick={() => {
                onChange({ target: { name, value: '' } });
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              -- Tidak ada / Reset --
            </div>
            {filteredOptions.map(opt => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${value === opt.value || value === parseInt(opt.value) ? 'bg-primary-50 dark:bg-primary-900/30 font-medium' : ''}`}
                onClick={() => {
                  onChange({ target: { name, value: opt.value } });
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Pencarian tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

const MenuForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [parentMenus, setParentMenus] = useState([])
  
  const [formData, setFormData] = useState({
    parent_id: '',
    nama_menu: '',
    url: '',
    icon: '',
    urutan: '',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchMenu()
    }
  }, [id])

  const fetchOptions = async () => {
    try {
      // Assuming you have endpoints for parent menus and permissions
      // If not, you might need to adjust these or mock them
      const [menusRes] = await Promise.all([
        menuService.getAll({ per_page: 100 }), // Get all for dropdown
      ])

      if (menusRes.data) {
        // Filter out the current menu to prevent self-parenting
        let availableParents = menusRes.data.data || [];
        if (isEditMode) {
           availableParents = availableParents.filter(m => m.id !== parseInt(id))
        }
        setParentMenus(availableParents)
      }
      
    } catch (error) {
      console.error("Error fetching options", error)
    }
  }

  const fetchMenu = async () => {
    setFetchingData(true)
    const { data, error } = await menuService.getById(id)
    if (data) {
      const menu = data.data
      setFormData({
        parent_id: menu.parent_id || '',
        nama_menu: menu.nama_menu || '',
        url: menu.url || '',
        icon: menu.icon || '',
        urutan: menu.urutan || '',
        is_active: menu.is_active !== undefined ? (menu.is_active === 1 || menu.is_active === true || menu.is_active === '1') : true
      })
    } else {
      showError('Gagal mengambil data menu')
      navigate('/admin/menus')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama_menu) newErrors.nama_menu = 'Nama Menu wajib diisi'
    if (!formData.url) newErrors.url = 'URL wajib diisi'
    if (!formData.urutan) newErrors.urutan = 'Urutan wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      nama_menu: formData.nama_menu,
      url: formData.url,
      icon: formData.icon || null,
      urutan: parseInt(formData.urutan),
      is_active: formData.is_active ? 1 : 0
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
      console.error(error)
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
              
              {/* Nama Menu */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama_menu"
                  value={formData.nama_menu}
                  onChange={handleChange}
                  placeholder="Contoh: Dashboard"
                  error={errors.nama_menu}
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <Input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="Contoh: /dashboard"
                  error={errors.url}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon (Bootstrap Icons)
                </label>
                <div className="flex gap-2 items-center">
                   <div className="flex-1">
                      <Input
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        placeholder="Contoh: bi-grid-1x2"
                        error={errors.icon}
                      />
                   </div>
                   {formData.icon && (
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                          <i className={`bi ${formData.icon} text-xl`}></i>
                      </div>
                   )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Cari icon di <a href="https://icons.getbootstrap.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Bootstrap Icons</a></p>
              </div>

              {/* Urutan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urutan <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="urutan"
                  value={formData.urutan}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  error={errors.urutan}
                />
              </div>

              {/* Parent ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Menu (Opsional)
                </label>
                <SearchableSelect
                  name="parent_id"
                  value={formData.parent_id}
                  onChange={handleChange}
                  placeholder="-- Tidak ada (Menu Utama) --"
                  options={parentMenus.map(m => ({ value: m.id, label: m.nama_menu }))}
                  error={errors.parent_id}
                />
              </div>


              {/* Status */}
              <div className="flex items-center h-full pt-6">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Menu Aktif
                    </span>
                 </label>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/menus')}>
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

export default MenuForm