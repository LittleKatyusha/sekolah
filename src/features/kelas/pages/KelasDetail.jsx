 import { useState, useEffect } from 'react'
 import { useParams, useNavigate } from 'react-router-dom'
 import { ArrowLeft, Edit, Trash2, Users, BookOpen, Calendar } from 'lucide-react'
 import { AgGridReact } from 'ag-grid-react'
 import 'ag-grid-community/styles/ag-grid.css'
 import 'ag-grid-community/styles/ag-theme-alpine.css'
 import Card from '../../../components/ui/Card'
 import Button from '../../../components/ui/Button'
 import { kelasService } from '../services/kelasService'
 import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
 
 const KelasDetail = () => {
   const { id } = useParams()
   const navigate = useNavigate()
 
   const [loading, setLoading] = useState(false)
   const [kelas, setKelas] = useState(null)
   const [siswaList, setSiswaList] = useState([])
   const [loadingSiswa, setLoadingSiswa] = useState(false)
   const [siswaError, setSiswaError] = useState(null)
 
   useEffect(() => {
     fetchKelas()
   }, [id])
 
   const fetchKelas = async () => {
     setLoading(true)
     const { data, error } = await kelasService.getById(id)
     if (data) {
       // Handle nested response: data.kelas or data directly
       setKelas(data.data?.kelas || data.data)
       fetchSiswa()
     } else {
       showError('Gagal mengambil data kelas')
       navigate('/kelas')
     }
     setLoading(false)
   }
 
   const fetchSiswa = async () => {
     setLoadingSiswa(true)
     setSiswaError(null)
     const { data, error } = await kelasService.getSiswaByKelasId(id)
     if (error) {
       setSiswaError('Gagal mengambil data siswa')
       setSiswaList([])
     } else if (data) {
       // Handle nested response: data.data.siswa, data.siswa, or data.data array
       const siswaData = data.data?.siswa || data.siswa || data.data || []
       setSiswaList(Array.isArray(siswaData) ? siswaData : [])
     }
     setLoadingSiswa(false)
   }
 
   const handleDelete = async () => {
     const result = await showDeleteConfirm(kelas.nama_kelas)
     if (result.isConfirmed) {
       const { error } = await kelasService.delete(kelas.id)
       if (!error) {
         showSuccess(`${kelas.nama_kelas} berhasil dihapus!`)
         navigate('/kelas')
       } else {
         showError('Gagal menghapus kelas')
       }
     }
   }
 
   const getTingkatColor = (tingkat) => {
     switch (tingkat) {
       case 10: return 'bg-green-100 text-green-800'
       case 11: return 'bg-yellow-100 text-yellow-800'
       case 12: return 'bg-red-100 text-red-800'
       default: return 'bg-blue-100 text-blue-800'
     }
   }
 
   const siswaColumnDefs = [
     { field: 'nis', headerName: 'NIS', sortable: true, filter: true, width: 120 },
     { field: 'nama', headerName: 'Nama', sortable: true, filter: true, flex: 1 },
     {
       field: 'jenis_kelamin',
       headerName: 'Jenis Kelamin',
       sortable: true,
       filter: true,
       width: 140,
       cellRenderer: (params) => {
         const jk = params.value
         if (jk === 'L' || jk === 'laki-laki' || jk === 'Laki-laki') return 'Laki-laki'
         if (jk === 'P' || jk === 'perempuan' || jk === 'Perempuan') return 'Perempuan'
         return jk || '-'
       }
     },
     {
       field: 'status',
       headerName: 'Status',
       sortable: true,
       filter: true,
       width: 120,
       cellRenderer: (params) => {
         const rawStatus = params.value ?? params.data?.status_siswa
         let colorClass = 'bg-gray-100 text-gray-800'
         let displayStatus = 'Tidak diketahui'
 
         // Handle numeric status (1 = aktif, 0 = non-aktif/tidak aktif)
         if (rawStatus === 1 || rawStatus === '1' || rawStatus === 'aktif') {
           displayStatus = 'Aktif'
           colorClass = 'bg-green-100 text-green-800'
         } else if (rawStatus === 0 || rawStatus === '0' || rawStatus === 'non-aktif' || rawStatus === 'tidak aktif') {
           displayStatus = 'Tidak Aktif'
           colorClass = 'bg-red-100 text-red-800'
         } else if (rawStatus === 'lulus') {
           displayStatus = 'Lulus'
           colorClass = 'bg-blue-100 text-blue-800'
         } else if (rawStatus === 'keluar') {
           displayStatus = 'Keluar'
           colorClass = 'bg-red-100 text-red-800'
         } else if (rawStatus === 'pindah') {
           displayStatus = 'Pindah'
           colorClass = 'bg-yellow-100 text-yellow-800'
         } else if (rawStatus !== undefined && rawStatus !== null) {
           displayStatus = String(rawStatus)
         }
 
         return (
           <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
             {displayStatus}
           </span>
         )
       }
     }
   ]
 
   if (loading || !kelas) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
       </div>
     )
   }
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
         <div className="flex items-center gap-4">
           <Button variant="secondary" onClick={() => navigate('/kelas')}>
             <ArrowLeft size={18} className="mr-2" />
             Kembali
           </Button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Kelas</h1>
         </div>
         <div className="flex gap-3">
           <Button variant="warning" onClick={() => navigate(`/kelas/${id}/edit`)}>
             <Edit size={18} className="mr-2" />
             Edit
           </Button>
           <Button variant="danger" onClick={handleDelete}>
             <Trash2 size={18} className="mr-2" />
             Hapus
           </Button>
         </div>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Info Card */}
         <div className="md:col-span-1">
           <Card>
             <div className="p-6">
               <div className="text-center mb-6">
                 <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <BookOpen size={40} className="text-primary-600" />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">{kelas.nama_kelas}</h2>
                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getTingkatColor(kelas.tingkat)}`}>
                   Kelas {kelas.tingkat}
                 </span>
               </div>
 
               <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                 <div className="flex items-center gap-3">
                   <Calendar size={18} className="text-gray-400" />
                   <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                     <p className="font-medium text-gray-900 dark:text-white">{kelas.tahun_ajaran}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <Users size={18} className="text-gray-400" />
                   <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Siswa</p>
                     <p className="font-medium text-gray-900 dark:text-white">
                       {kelas.jumlah_siswa || 0}
                       {kelas.kapasitas && <span className="text-gray-400 text-sm"> / {kelas.kapasitas}</span>}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <Users size={18} className="text-gray-400" />
                   <div>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Wali Kelas</p>
                     <p className="font-medium text-gray-900 dark:text-white">
                       {kelas.wali_guru?.nama || '-'}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           </Card>
         </div>
 
         {/* Siswa List */}
         <div className="md:col-span-3">
           <Card>
             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <Users size={20} />
                 Daftar Siswa
               </h3>
             </div>
             <div className="p-4">
               {loadingSiswa ? (
                 <div className="flex items-center justify-center h-48">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                 </div>
               ) : siswaError ? (
                 <div className="text-center py-12">
                   <div className="text-red-500 mb-2">
                     <Users size={48} className="mx-auto text-red-300" />
                   </div>
                   <p className="text-red-600 font-medium">{siswaError}</p>
                   <Button
                     variant="secondary"
                     className="mt-4"
                     onClick={fetchSiswa}
                   >
                     Coba Lagi
                   </Button>
                 </div>
               ) : siswaList.length > 0 ? (
                 <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 400 }}>
                   <AgGridReact
                     rowData={siswaList}
                     columnDefs={siswaColumnDefs}
                     defaultColDef={{ resizable: true, sortable: true, filter: true }}
                     pagination={true}
                     paginationPageSize={10}
                     animateRows={true}
                   />
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <Users size={48} className="mx-auto text-gray-300 mb-3" />
                   <p className="text-gray-500">Belum ada siswa di kelas ini</p>
                 </div>
               )}
             </div>
           </Card>
         </div>
       </div>
     </div>
   )
 }
 
 export default KelasDetail
 