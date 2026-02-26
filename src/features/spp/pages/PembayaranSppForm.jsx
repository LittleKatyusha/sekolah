import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { pembayaranSppService, tarifSppService } from '../services/sppService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BULAN_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

const STATUS_OPTIONS = [
  { value: '1', label: 'Belum Bayar' },
  { value: '2', label: 'Lunas' },
  { value: '3', label: 'Cicilan' },
  { value: '4', label: 'Dispensasi' },
]

const METODE_OPTIONS = [
  { value: '1', label: 'Tunai' },
  { value: '2', label: 'Transfer Bank' },
  { value: '3', label: 'E-Wallet' },
  { value: '4', label: 'Lainnya' },
]

const PembayaranSppForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_tarif_spp_id: '',
    bulan: '',
    tahun: String(new Date().getFullYear()),
    tanggal_bayar: new Date().toISOString().split('T')[0],
    jumlah_bayar: '',
    status: '2',
    metode_pembayaran: '1',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})
  const [siswaOptions, setSiswaOptions] = useState([])
  const [tarifOptions, setTarifOptions] = useState([])

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchPembayaran()
    }
  }, [id])

  const fetchOptions = async () => {
    const [siswaRes, tarifRes] = await Promise.all([
      siswaService.getAll({ per_page: 100 }),
      tarifSppService.getAll({ per_page: 100 })
    ])

    const siswaList = siswaRes.data?.data || []
    setSiswaOptions(siswaList.map(s => ({
      value: String(s.id),
      label: s.nis ? `${s.nama} (${s.nis})` : s.nama || `Siswa #${s.id}`
    })))

    const tarifList = tarifRes.data?.data || []
    setTarifOptions(tarifList.map(t => ({
      value: String(t.id),
      label: `${t.kelas?.nama_kelas || 'Kelas ?'} - Rp ${Number(t.nominal || 0).toLocaleString('id-ID')}`
    })))
  }

  const fetchPembayaran = async () => {
    setFetchingData(true)
    const { data, error } = await pembayaranSppService.getById(id)
    if (data) {
      const p = data.data
      setFormData({
        mst_siswa_id: p.siswa?.id ? String(p.siswa.id) : '',
        mst_tarif_spp_id: p.tarif_spp?.id ? String(p.tarif_spp.id) : '',
        bulan: p.bulan ? String(p.bulan) : '',
        tahun: p.tahun ? String(p.tahun) : '',
        tanggal_bayar: p.tanggal_bayar || '',
        jumlah_bayar: p.jumlah_bayar !== null && p.jumlah_bayar !== undefined ? String(p.jumlah_bayar) : '',
        status: p.status !== null && p.status !== undefined ? String(p.status) : '2',
        metode_pembayaran: p.metode_pembayaran !== null && p.metode_pembayaran !== undefined ? String(p.metode_pembayaran) : '1',
        keterangan: p.keterangan || ''
      })
    } else {
      showError('Gagal mengambil data pembayaran SPP')
      navigate('/keuangan/pembayaran-spp')
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
    if (!isEditMode) {
      if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
      if (!formData.mst_tarif_spp_id) newErrors.mst_tarif_spp_id = 'Tarif SPP wajib dipilih'
      if (!formData.bulan) newErrors.bulan = 'Bulan wajib dipilih'
      if (!formData.tahun) newErrors.tahun = 'Tahun wajib diisi'
      if (!formData.jumlah_bayar || parseFloat(formData.jumlah_bayar) < 0) newErrors.jumlah_bayar = 'Jumlah bayar wajib diisi'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    let submitData
    let result

    if (isEditMode) {
      submitData = {
        tanggal_bayar: formData.tanggal_bayar || null,
        jumlah_bayar: formData.jumlah_bayar ? parseFloat(formData.jumlah_bayar) : null,
        status: formData.status ? parseInt(formData.status) : null,
        metode_pembayaran: formData.metode_pembayaran ? parseInt(formData.metode_pembayaran) : null,
        keterangan: formData.keterangan || null
      }
      result = await pembayaranSppService.update(id, submitData)
    } else {
      submitData = {
        mst_siswa_id: parseInt(formData.mst_siswa_id),
        mst_tarif_spp_id: parseInt(formData.mst_tarif_spp_id),
        bulan: parseInt(formData.bulan),
        tahun: parseInt(formData.tahun),
        tanggal_bayar: formData.tanggal_bayar || null,
        jumlah_bayar: parseFloat(formData.jumlah_bayar),
        status: formData.status ? parseInt(formData.status) : null,
        metode_pembayaran: formData.metode_pembayaran ? parseInt(formData.metode_pembayaran) : null,
        keterangan: formData.keterangan || null
      }
      result = await pembayaranSppService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Pembayaran SPP berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/keuangan/pembayaran-spp')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} pembayaran SPP`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Pembayaran SPP' : 'Tambah Pembayaran SPP Baru'}
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
              {!isEditMode && (
                <>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tarif SPP <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      name="mst_tarif_spp_id"
                      value={formData.mst_tarif_spp_id}
                      onChange={handleChange}
                      options={tarifOptions}
                      placeholder="Pilih tarif SPP"
                      error={errors.mst_tarif_spp_id}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bulan <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      name="bulan"
                      value={formData.bulan}
                      onChange={handleChange}
                      options={BULAN_OPTIONS}
                      placeholder="Pilih bulan"
                      error={errors.bulan}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tahun <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="tahun"
                      value={formData.tahun}
                      onChange={handleChange}
                      placeholder="Masukkan tahun"
                      min="2000"
                      max="2100"
                      error={errors.tahun}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jumlah Bayar (Rp) {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="number"
                  name="jumlah_bayar"
                  value={formData.jumlah_bayar}
                  onChange={handleChange}
                  placeholder="Masukkan jumlah bayar"
                  min="0"
                  step="1000"
                  error={errors.jumlah_bayar}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Bayar
                </label>
                <Input
                  type="date"
                  name="tanggal_bayar"
                  value={formData.tanggal_bayar}
                  onChange={handleChange}
                  error={errors.tanggal_bayar}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <SearchableSelect
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                  placeholder="Pilih status"
                  error={errors.status}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metode Pembayaran
                </label>
                <SearchableSelect
                  name="metode_pembayaran"
                  value={formData.metode_pembayaran}
                  onChange={handleChange}
                  options={METODE_OPTIONS}
                  placeholder="Pilih metode pembayaran"
                  error={errors.metode_pembayaran}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder="Keterangan (opsional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.keterangan && (
                  <p className="mt-1 text-sm text-red-500">{errors.keterangan}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
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

export default PembayaranSppForm