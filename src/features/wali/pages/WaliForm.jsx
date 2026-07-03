import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/guards/PermissionGuard';
import { waliService } from '../services/waliService';
import referenceService from '../../../services/referenceService';
import { showSuccess, showError } from '../../../utils/sweetalert';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { normalizeReferenceCode, safeParseInt } from '../../../utils/referenceUtils';

const mapReferenceOptions = (response) => {
  if (!response.data?.success) return [];

  return response.data.data.map((item) => ({
    value: String(item.kode),
    label: item.nama,
  }));
};

const WaliForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const pageTitle = isEditMode ? 'Edit Wali' : 'Tambah Wali';
  usePageTitle(pageTitle);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Dropdown options state
  const [jenisKelaminOptions, setJenisKelaminOptions] = useState([]);
  const [pendidikanOptions, setPendidikanOptions] = useState([]);
  const [pekerjaanOptions, setPekerjaanOptions] = useState([]);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    jenis_kelamin: '',
    no_hp: '',
    alamat: '',
    pendidikan_terakhir: '',
    pekerjaan: '',
    penghasilan: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      const options = await fetchDropdownOptions();
      if (isEditMode) {
        await fetchWali(options);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const fetchDropdownOptions = async () => {
    setFetchingOptions(true);
    
    // Fetch all dropdown options in parallel
    const [jenisKelaminRes, pendidikanRes, pekerjaanRes] = await Promise.all([
      referenceService.getReferencesByCategory('jenis_kelamin'),
      referenceService.getReferencesByCategory('pendidikan_terakhir'),
      referenceService.getReferencesByCategory('pekerjaan'),
    ]);

    const nextJenisKelaminOptions = mapReferenceOptions(jenisKelaminRes);
    const nextPendidikanOptions = mapReferenceOptions(pendidikanRes);
    const nextPekerjaanOptions = mapReferenceOptions(pekerjaanRes);

    setJenisKelaminOptions(nextJenisKelaminOptions);
    setPendidikanOptions(nextPendidikanOptions);
    setPekerjaanOptions(nextPekerjaanOptions);

    if (nextJenisKelaminOptions.length > 0 && !formData.jenis_kelamin) {
      setFormData((prev) => ({
        ...prev,
        jenis_kelamin: nextJenisKelaminOptions[0].value,
      }));
    }

    setFetchingOptions(false);
    return {
      jenisKelaminOptions: nextJenisKelaminOptions,
      pendidikanOptions: nextPendidikanOptions,
      pekerjaanOptions: nextPekerjaanOptions,
    };
  };

  const fetchWali = async (options = { jenisKelaminOptions, pendidikanOptions, pekerjaanOptions }) => {
    setFetchingData(true);
    const { data, error } = await waliService.getWaliById(id);
    if (data) {
      const wali = data.data;
      setFormData({
        nama: wali.nama || '',
        nik: wali.nik || '',
        jenis_kelamin: normalizeReferenceCode(wali.jenis_kelamin, options.jenisKelaminOptions),
        no_hp: wali.no_hp || '',
        alamat: wali.alamat || '',
        pendidikan_terakhir: normalizeReferenceCode(wali.pendidikan_terakhir, options.pendidikanOptions),
        pekerjaan: normalizeReferenceCode(wali.pekerjaan, options.pekerjaanOptions),
        penghasilan: wali.penghasilan || '',
      });
    } else {
      showError('Gagal mengambil data wali');
      navigate('/wali');
    }
    setFetchingData(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi';
    if (!formData.nik) newErrors.nik = 'NIK wajib diisi';
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const submitData = {
      ...formData,
      jenis_kelamin: safeParseInt(formData.jenis_kelamin),
      pendidikan_terakhir: formData.pendidikan_terakhir ? safeParseInt(formData.pendidikan_terakhir) : null,
      pekerjaan: formData.pekerjaan ? safeParseInt(formData.pekerjaan) : null,
    };

    let result;
    if (isEditMode) {
      result = await waliService.updateWali(id, submitData);
    } else {
      result = await waliService.createWali(submitData);
    }

    const { error } = result;

    if (!error) {
      showSuccess(`Wali berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      navigate('/wali');
    } else {
      console.error(error);
      if (error.errors) {
        setErrors(error.errors);
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} wali`);
      }
    }
    setLoading(false);
  };

  // Show loading when either dropdown options or data is being fetched
  const isLoading = fetchingOptions || fetchingData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/wali')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {pageTitle}
        </h1>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama Lengkap Wali"
                  error={errors.nama}
                />
              </div>

              {/* NIK */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIK <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nik"
                  value={formData.nik}
                  onChange={handleChange}
                  placeholder="Nomor Induk Kependudukan"
                  error={errors.nik}
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {jenisKelaminOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.jenis_kelamin && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jenis_kelamin) ? errors.jenis_kelamin[0] : errors.jenis_kelamin}
                  </p>
                )}
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No. HP
                </label>
                <Input
                  name="no_hp"
                  value={formData.no_hp}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  error={errors.no_hp}
                />
              </div>
              
              {/* Pendidikan Terakhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  name="pendidikan_terakhir"
                  value={formData.pendidikan_terakhir}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Pendidikan</option>
                    {pendidikanOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                {errors.pendidikan_terakhir && <p className="mt-1 text-sm text-red-500">{errors.pendidikan_terakhir}</p>}
              </div>

              {/* Pekerjaan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pekerjaan
                </label>
                <select
                  name="pekerjaan"
                  value={formData.pekerjaan}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Pekerjaan</option>
                  {pekerjaanOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.pekerjaan && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.pekerjaan) ? errors.pekerjaan[0] : errors.pekerjaan}
                  </p>
                )}
              </div>

              {/* Penghasilan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penghasilan
                </label>
                <Input
                  name="penghasilan"
                  value={formData.penghasilan}
                  onChange={handleChange}
                  placeholder="Contoh: 3000000"
                  error={errors.penghasilan}
                />
              </div>

              {/* Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Alamat Lengkap"
                />
                {errors.alamat && <p className="mt-1 text-sm text-red-500">{errors.alamat}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/wali')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'wali.edit' : 'wali.create'}>
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
  );
};

export default WaliForm;
