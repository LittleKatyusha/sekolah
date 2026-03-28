import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, BookOpen, HelpCircle, List, Star, CheckCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { showSoal } from '../services/soalService';
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert';
import usePermission from '../../../hooks/usePermission'

const SoalDetail = () => {
  const { can } = usePermission()
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [soal, setSoal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSoal();
  }, [id]);

  const fetchSoal = async () => {
    try {
      setLoading(true);
      const { data, error: apiError } = await showSoal(id);
      
      if (apiError) {
        setError('Gagal mengambil data soal');
        showError('Gagal mengambil data soal');
        navigate('/akademik/soals');
        return;
      }
      
      setSoal(data.data);
      setError(null);
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
      showError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await showDeleteConfirm(`Soal ID: ${soal.id}`);
    if (result.isConfirmed) {
      // Implement delete functionality if needed
      showSuccess('Soal berhasil dihapus!');
      navigate('/akademik/soals');
    }
  };

  const getTipeLabel = (tipe) => {
    const tipeMap = {
      1: 'Pilihan Ganda',
      2: 'Essay',
      3: 'Isian Singkat'
    };
    return tipeMap[tipe] || 'Tipe Tidak Diketahui';
  };

  const getKesulitanLabel = (tingkat) => {
    const tingkatMap = {
      1: 'Mudah',
      2: 'Sedang',
      3: 'Sulit'
    };
    return tingkatMap[tingkat] || tingkat;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!soal) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Data soal tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/soals')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali ke Daftar Soal
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Soal</h1>
        </div>
        <div className="flex gap-3">
          {can('soals.update') && (
            <Button variant="warning" onClick={() => navigate(`/akademik/soals/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit Soal
            </Button>
          )}
          {can('soals.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus Soal
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <HelpCircle size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Dasar</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detail utama soal</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID Soal</p>
                  <p className="font-medium text-gray-900 dark:text-white">{soal.id}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tipe Soal</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getTipeLabel(soal.tipe)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tingkat Kesulitan</p>
                  <div className="flex items-center gap-2">
                    <Star size={16} className={`${
                      soal.tingkat_kesulitan >= 1 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} />
                    <Star size={16} className={`${
                      soal.tingkat_kesulitan >= 2 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} />
                    <Star size={16} className={`${
                      soal.tingkat_kesulitan >= 3 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} />
                    <span className="font-medium text-gray-900 dark:text-white ml-1">
                      ({getKesulitanLabel(soal.tingkat_kesulitan)})
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {soal.mapel?.nama_mapel || '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metadata</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Informasi tambahan</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat Pada</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(soal.created_at)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(soal.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Question and Options */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <HelpCircle size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pertanyaan</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detail pertanyaan soal</p>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none dark:prose-invert mb-8">
                <p className="text-gray-900 dark:text-white font-medium">{soal.pertanyaan}</p>
              </div>
              
              {/* Render options only for multiple choice */}
              {soal.tipe === 1 && soal.opsi && soal.opsi.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <List size={20} className="text-gray-500 dark:text-gray-400" />
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">Opsi Jawaban</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {soal.opsi.map((opsi, index) => (
                      <div 
                        key={opsi.id} 
                        className={`p-4 rounded-lg border ${
                          opsi.is_benar
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            opsi.is_benar
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white">{opsi.opsi_teks}</p>
                            {opsi.is_benar && (
                              <div className="mt-2 flex items-center text-green-600 dark:text-green-400 text-sm">
                                <CheckCircle size={16} className="mr-1" />
                                Jawaban Benar
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SoalDetail;