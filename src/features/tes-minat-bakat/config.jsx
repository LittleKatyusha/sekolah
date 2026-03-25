import {
  ClipboardList,
  FileText,
  HelpCircle,
  BarChart3,
  Sparkles,
  Users,
} from 'lucide-react'
import { formatDateShort, formatDateTime } from '../../utils/formatters'
import { siswaService } from '../siswa/services/siswaService'
import { tahunAjaranService } from '../tahun-ajaran/services/tahunAjaranService'
import tesMinatBakatService from './services/tesMinatBakatService'

const makeBadge = (label, className) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {label}
  </span>
)

const toDateTimeInputValue = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const getListItems = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data
  if (Array.isArray(response?.data)) return response.data
  return []
}

export const getTotalCount = (response) => (
  response?.data?.meta?.total
  ?? response?.data?.total
  ?? response?.data?.data?.length
  ?? 0
)

const loadOptions = async (serviceMethod, mapOption, params = {}) => {
  const response = await serviceMethod({ per_page: 'all', ...params })
  return getListItems(response).map(mapOption)
}

const toInteger = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const toFloat = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return null
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

const defaultNormalizeIn = (fields, record) => fields.reduce((accumulator, field) => {
  const rawValue = record?.[field.name]

  if (field.type === 'checkbox') {
    accumulator[field.name] = Boolean(rawValue)
    return accumulator
  }

  if (field.type === 'datetime-local') {
    accumulator[field.name] = toDateTimeInputValue(rawValue)
    return accumulator
  }

  accumulator[field.name] = rawValue ?? ''
  return accumulator
}, {})

const defaultNormalizeOut = (fields, formData) => fields.reduce((accumulator, field) => {
  const value = formData[field.name]

  if (field.type === 'checkbox') {
    accumulator[field.name] = Boolean(value)
    return accumulator
  }

  if (value === '' || value === null || typeof value === 'undefined') {
    accumulator[field.name] = null
    return accumulator
  }

  if (field.valueType === 'integer') {
    accumulator[field.name] = toInteger(value)
    return accumulator
  }

  if (field.valueType === 'number') {
    accumulator[field.name] = toFloat(value)
    return accumulator
  }

  accumulator[field.name] = value
  return accumulator
}, {})

const buildOptionsMap = (options) => options.reduce((accumulator, option) => {
  accumulator[option.value] = option
  return accumulator
}, {})

export const JENIS_TES_OPTIONS = [
  { value: 1, label: 'Tes Minat', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 2, label: 'Tes Bakat', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 3, label: 'Tes Gabungan', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
]

export const STATUS_TES_OPTIONS = [
  { value: 1, label: 'Draft', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 2, label: 'Aktif', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 3, label: 'Selesai', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 4, label: 'Arsip', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
]

export const STATUS_PESERTA_OPTIONS = [
  { value: 1, label: 'Belum mulai', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  { value: 2, label: 'Mengerjakan', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 3, label: 'Selesai', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
]

export const TIPE_PERTANYAAN_OPTIONS = [
  { value: 1, label: 'Pilihan Ganda', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  { value: 2, label: 'Skala Likert', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
]

const JENIS_TES_MAP = buildOptionsMap(JENIS_TES_OPTIONS)
const STATUS_TES_MAP = buildOptionsMap(STATUS_TES_OPTIONS)
const STATUS_PESERTA_MAP = buildOptionsMap(STATUS_PESERTA_OPTIONS)
const TIPE_PERTANYAAN_MAP = buildOptionsMap(TIPE_PERTANYAAN_OPTIONS)

export const renderOptionBadge = (value, optionMap) => {
  const option = optionMap[value]
  if (!option) return value ?? '-'
  return makeBadge(option.label, option.badge)
}

const renderActiveBadge = (value) => value
  ? makeBadge('Aktif', 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400')
  : makeBadge('Nonaktif', 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400')

const getName = (value, fallback = '-') => value || fallback

const renderOpsiLabel = (opsi) => {
  if (!opsi) return '-'

  const label = [opsi.label, opsi.teks_opsi].filter(Boolean).join(' - ')
  return label || '-'
}

const getOpsiDisplay = (opsi, fallback = '-') => {
  const label = renderOpsiLabel(opsi)
  return label !== '-' ? label : fallback
}

const renderOpsiList = (opsi = []) => {
  if (!Array.isArray(opsi) || opsi.length === 0) {
    return <span>-</span>
  }

  return (
    <div className="space-y-2">
      {opsi.map((item) => (
        <div key={item.id || `${item.label}-${item.urutan || 0}`} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{renderOpsiLabel(item)}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Skor: {item.skor ?? '-'}
            {item.aspek?.nama_aspek ? ` | Aspek: ${item.aspek.nama_aspek}` : ''}
            {item.urutan ? ` | Urutan: ${item.urutan}` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

export const tesMinatBakatResources = {
  tes: {
    key: 'tes',
    segment: 'tes',
    icon: ClipboardList,
    navTitle: 'Master Tes',
    navDescription: 'Kelola master tes minat, bakat, dan kombinasi keduanya.',
    listTitle: 'Master Tes Minat dan Bakat',
    searchPlaceholder: 'Cari tes minat dan bakat...',
    endpoint: '/akademik/tes-minat-bakat/',
    basePath: '/akademik/tes-minat-bakat/tes',
    service: tesMinatBakatService.tes,
    fields: [
      { name: 'kode_tes', label: 'Kode Tes', type: 'text', placeholder: 'Contoh: TMB-2026-001' },
      { name: 'nama', label: 'Nama Tes', type: 'text', placeholder: 'Masukkan nama tes', required: true },
      { name: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'select', optionsKey: 'tahunAjaran', valueType: 'integer', placeholder: 'Pilih tahun ajaran' },
      { name: 'jenis_tes', label: 'Jenis Tes', type: 'select', options: JENIS_TES_OPTIONS, valueType: 'integer', required: true, placeholder: 'Pilih jenis tes' },
      { name: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'datetime-local' },
      { name: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'datetime-local' },
      { name: 'durasi_menit', label: 'Durasi (Menit)', type: 'number', valueType: 'integer', placeholder: '90' },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_TES_OPTIONS, valueType: 'integer', placeholder: 'Pilih status' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', span: 2, rows: 3, placeholder: 'Deskripsi tes' },
      { name: 'catatan', label: 'Catatan', type: 'textarea', span: 2, rows: 3, placeholder: 'Catatan tambahan' },
    ],
    optionLoaders: {
      tahunAjaran: async () => await loadOptions(
        tahunAjaranService.getAll,
        (item) => ({ value: item.id, label: item.nama_tahun_ajaran || item.tahun_ajaran || item.nama || `Tahun Ajaran #${item.id}` })
      ),
    },
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      { field: 'kode_tes', headerName: 'Kode', minWidth: 130, flex: 1 },
      { field: 'nama', headerName: 'Nama Tes', minWidth: 220, flex: 2 },
      {
        headerName: 'Tahun Ajaran',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.tahun_ajaran?.nama_tahun_ajaran || params.data?.tahun_ajaran?.tahun_ajaran || '-',
      },
      {
        field: 'jenis_tes',
        headerName: 'Jenis',
        minWidth: 140,
        cellRenderer: (params) => renderOptionBadge(params.value, JENIS_TES_MAP),
      },
      {
        headerName: 'Peserta',
        minWidth: 120,
        cellRenderer: (params) => params.data?.peserta?.length ?? 0,
      },
      {
        field: 'tanggal_mulai',
        headerName: 'Mulai',
        minWidth: 150,
        cellRenderer: (params) => formatDateShort(params.value),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 130,
        cellRenderer: (params) => renderOptionBadge(params.value, STATUS_TES_MAP),
      },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Tes',
        fields: [
          { label: 'Kode Tes', value: (record) => getName(record.kode_tes) },
          { label: 'Nama Tes', value: (record) => getName(record.nama) },
          { label: 'Jenis Tes', value: (record) => renderOptionBadge(record.jenis_tes, JENIS_TES_MAP) },
          { label: 'Status', value: (record) => renderOptionBadge(record.status, STATUS_TES_MAP) },
          { label: 'Tahun Ajaran', value: (record) => getName(record.tahun_ajaran?.nama_tahun_ajaran || record.tahun_ajaran?.tahun_ajaran) },
          { label: 'Jumlah Peserta', value: (record) => record.peserta?.length ?? 0 },
          { label: 'Jumlah Pertanyaan', value: (record) => record.pertanyaan?.length ?? 0 },
          { label: 'Tanggal Mulai', value: (record) => formatDateTime(record.tanggal_mulai) },
          { label: 'Tanggal Selesai', value: (record) => formatDateTime(record.tanggal_selesai) },
          { label: 'Durasi', value: (record) => record.durasi_menit ? `${record.durasi_menit} menit` : '-' },
          { label: 'Deskripsi', value: (record) => getName(record.deskripsi) },
          { label: 'Catatan', value: (record) => getName(record.catatan) },
        ],
      },
    ],
    summary: (record) => ({
      title: record.nama || 'Tes Minat dan Bakat',
      subtitle: record.kode_tes || 'Tanpa kode tes',
      badge: renderOptionBadge(record.status, STATUS_TES_MAP),
    }),
    getDeleteLabel: (record) => `tes "${record.nama || record.kode_tes || record.id}"`,
  },
  aspek: {
    key: 'aspek',
    segment: 'aspek',
    icon: Sparkles,
    navTitle: 'Aspek Penilaian',
    navDescription: 'Kelola dimensi minat atau bakat yang dipakai untuk klasifikasi hasil.',
    listTitle: 'Aspek Tes Minat dan Bakat',
    searchPlaceholder: 'Cari aspek penilaian...',
    endpoint: '/akademik/tes-minat-bakat-aspek/',
    basePath: '/akademik/tes-minat-bakat/aspek',
    service: tesMinatBakatService.aspek,
    fields: [
      { name: 'kode_aspek', label: 'Kode Aspek', type: 'text', required: true, placeholder: 'Contoh: ASP-SAINTEK' },
      { name: 'nama_aspek', label: 'Nama Aspek', type: 'text', required: true, placeholder: 'Masukkan nama aspek' },
      { name: 'urutan', label: 'Urutan', type: 'number', valueType: 'integer', placeholder: '1' },
      { name: 'is_active', label: 'Aktif', type: 'checkbox' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', span: 2, rows: 4, placeholder: 'Deskripsi aspek' },
    ],
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      { field: 'kode_aspek', headerName: 'Kode', minWidth: 150, flex: 1 },
      { field: 'nama_aspek', headerName: 'Nama Aspek', minWidth: 220, flex: 2 },
      { field: 'urutan', headerName: 'Urutan', minWidth: 100 },
      {
        field: 'is_active',
        headerName: 'Status',
        minWidth: 120,
        cellRenderer: (params) => renderActiveBadge(Boolean(params.value)),
      },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Aspek',
        fields: [
          { label: 'Kode Aspek', value: (record) => getName(record.kode_aspek) },
          { label: 'Nama Aspek', value: (record) => getName(record.nama_aspek) },
          { label: 'Urutan', value: (record) => record.urutan ?? '-' },
          { label: 'Status', value: (record) => renderActiveBadge(Boolean(record.is_active)) },
          { label: 'Deskripsi', value: (record) => getName(record.deskripsi) },
        ],
      },
    ],
    summary: (record) => ({
      title: record.nama_aspek || 'Aspek Penilaian',
      subtitle: record.kode_aspek || 'Tanpa kode aspek',
      badge: renderActiveBadge(Boolean(record.is_active)),
    }),
    getDeleteLabel: (record) => `aspek "${record.nama_aspek || record.kode_aspek || record.id}"`,
  },
  pertanyaan: {
    key: 'pertanyaan',
    segment: 'pertanyaan',
    icon: HelpCircle,
    navTitle: 'Pertanyaan',
    navDescription: 'Susun pertanyaan dan kaitkan ke tes serta aspek yang sesuai.',
    listTitle: 'Pertanyaan Tes Minat dan Bakat',
    searchPlaceholder: 'Cari pertanyaan tes...',
    endpoint: '/akademik/tes-minat-bakat-pertanyaan/',
    basePath: '/akademik/tes-minat-bakat/pertanyaan',
    service: tesMinatBakatService.pertanyaan,
    fields: [
      { name: 'trx_tes_minat_bakat_id', label: 'Tes', type: 'select', optionsKey: 'tes', valueType: 'integer', required: true, placeholder: 'Pilih tes' },
      { name: 'mst_tes_minat_bakat_aspek_id', label: 'Aspek', type: 'select', optionsKey: 'aspek', valueType: 'integer', placeholder: 'Pilih aspek' },
      { name: 'tipe_jawaban', label: 'Tipe Jawaban', type: 'select', options: TIPE_PERTANYAAN_OPTIONS, valueType: 'integer', required: true, placeholder: 'Pilih tipe jawaban' },
      { name: 'urutan', label: 'Urutan', type: 'number', valueType: 'integer', placeholder: '1' },
      { name: 'is_active', label: 'Aktif', type: 'checkbox' },
      { name: 'pertanyaan', label: 'Pertanyaan', type: 'textarea', span: 2, rows: 4, required: true, placeholder: 'Tulis pertanyaan tes' },
    ],
    optionLoaders: {
      tes: async () => await loadOptions(
        tesMinatBakatService.tes.getAll,
        (item) => ({ value: item.id, label: item.nama || item.kode_tes || `Tes #${item.id}` }),
        { sort_by: 'nama', sort_dir: 'asc' }
      ),
      aspek: async () => await loadOptions(
        tesMinatBakatService.aspek.getAll,
        (item) => ({ value: item.id, label: item.nama_aspek || item.kode_aspek || `Aspek #${item.id}` }),
        { sort_by: 'urutan', sort_dir: 'asc' }
      ),
    },
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      {
        headerName: 'Tes',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.tes?.nama || '-',
      },
      {
        headerName: 'Aspek',
        minWidth: 170,
        flex: 1,
        cellRenderer: (params) => params.data?.aspek?.nama_aspek || '-',
      },
      {
        field: 'pertanyaan',
        headerName: 'Pertanyaan',
        minWidth: 280,
        flex: 2,
        cellRenderer: (params) => params.value || '-',
      },
      {
        field: 'tipe_jawaban',
        headerName: 'Tipe',
        minWidth: 140,
        cellRenderer: (params) => renderOptionBadge(params.value, TIPE_PERTANYAAN_MAP),
      },
      { field: 'urutan', headerName: 'Urutan', minWidth: 90 },
      {
        field: 'is_active',
        headerName: 'Status',
        minWidth: 120,
        cellRenderer: (params) => renderActiveBadge(Boolean(params.value)),
      },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Pertanyaan',
        fields: [
          { label: 'Tes', value: (record) => getName(record.tes?.nama) },
          { label: 'Aspek', value: (record) => getName(record.aspek?.nama_aspek) },
          { label: 'Tipe Jawaban', value: (record) => renderOptionBadge(record.tipe_jawaban, TIPE_PERTANYAAN_MAP) },
          { label: 'Urutan', value: (record) => record.urutan ?? '-' },
          { label: 'Status', value: (record) => renderActiveBadge(Boolean(record.is_active)) },
          { label: 'Pertanyaan', value: (record) => getName(record.pertanyaan) },
        ],
      },
      {
        title: 'Opsi Jawaban',
        fields: [
          { label: 'Daftar Opsi', value: (record) => renderOpsiList(record.opsi), span: 2 },
        ],
      },
    ],
    summary: (record) => ({
      title: record.pertanyaan || 'Pertanyaan Tes',
      subtitle: record.tes?.nama || 'Tanpa tes',
      badge: renderOptionBadge(record.tipe_jawaban, TIPE_PERTANYAAN_MAP),
    }),
    getDeleteLabel: (record) => `pertanyaan "${record.pertanyaan || record.id}"`,
  },
  peserta: {
    key: 'peserta',
    segment: 'peserta',
    icon: Users,
    navTitle: 'Peserta',
    navDescription: 'Daftarkan siswa, pantau progres, dan kelola sesi pengerjaan tes.',
    listTitle: 'Peserta Tes Minat dan Bakat',
    searchPlaceholder: 'Cari peserta tes...',
    endpoint: '/akademik/tes-minat-bakat-peserta/',
    basePath: '/akademik/tes-minat-bakat/peserta',
    service: tesMinatBakatService.peserta,
    fields: [
      { name: 'trx_tes_minat_bakat_id', label: 'Tes', type: 'select', optionsKey: 'tes', valueType: 'integer', required: true, placeholder: 'Pilih tes' },
      { name: 'mst_siswa_id', label: 'Siswa', type: 'select', optionsKey: 'siswa', valueType: 'integer', required: true, placeholder: 'Pilih siswa' },
      { name: 'nomor_peserta', label: 'Nomor Peserta', type: 'text', placeholder: 'Nomor peserta' },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_PESERTA_OPTIONS, valueType: 'integer', placeholder: 'Pilih status' },
      { name: 'hasil_ringkas', label: 'Hasil Ringkas', type: 'textarea', span: 2, rows: 3, placeholder: 'Ringkasan hasil peserta' },
      { name: 'rekomendasi', label: 'Rekomendasi', type: 'textarea', span: 2, rows: 3, placeholder: 'Rekomendasi tindak lanjut' },
    ],
    optionLoaders: {
      tes: async () => await loadOptions(
        tesMinatBakatService.tes.getAll,
        (item) => ({ value: item.id, label: item.nama || item.kode_tes || `Tes #${item.id}` }),
        { sort_by: 'nama', sort_dir: 'asc' }
      ),
      siswa: async () => await loadOptions(
        siswaService.getAll,
        (item) => ({ value: item.id, label: item.nama || item.nis || `Siswa #${item.id}` }),
        { sort_by: 'nama', sort_dir: 'asc' }
      ),
    },
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      {
        headerName: 'Tes',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.tes?.nama || '-',
      },
      {
        headerName: 'Siswa',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.siswa?.nama || '-',
      },
      { field: 'nomor_peserta', headerName: 'Nomor Peserta', minWidth: 140 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 140,
        cellRenderer: (params) => renderOptionBadge(params.value, STATUS_PESERTA_MAP),
      },
      {
        field: 'waktu_mulai',
        headerName: 'Mulai',
        minWidth: 150,
        cellRenderer: (params) => formatDateShort(params.value),
      },
      {
        field: 'waktu_selesai',
        headerName: 'Selesai',
        minWidth: 150,
        cellRenderer: (params) => formatDateShort(params.value),
      },
      {
        field: 'skor_total',
        headerName: 'Skor Total',
        minWidth: 110,
        cellRenderer: (params) => params.value ?? '-',
      },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Peserta',
        fields: [
          { label: 'Tes', value: (record) => getName(record.tes?.nama) },
          { label: 'Siswa', value: (record) => getName(record.siswa?.nama) },
          { label: 'Nomor Peserta', value: (record) => getName(record.nomor_peserta) },
          { label: 'Status', value: (record) => renderOptionBadge(record.status, STATUS_PESERTA_MAP) },
          { label: 'Waktu Mulai', value: (record) => formatDateTime(record.waktu_mulai) },
          { label: 'Waktu Selesai', value: (record) => formatDateTime(record.waktu_selesai) },
          { label: 'Skor Total', value: (record) => record.skor_total ?? '-' },
          { label: 'Hasil Ringkas', value: (record) => getName(record.hasil_ringkas) },
          { label: 'Rekomendasi', value: (record) => getName(record.rekomendasi) },
        ],
      },
    ],
    summary: (record) => ({
      title: record.siswa?.nama || 'Peserta Tes',
      subtitle: record.tes?.nama || record.nomor_peserta || 'Tanpa identitas peserta',
      badge: renderOptionBadge(record.status, STATUS_PESERTA_MAP),
    }),
    extraActions: (record) => {
      const actions = []

      if (record.status === 1) {
        actions.push({
          label: 'Mulai Tes',
          variant: 'success',
          action: async () => await tesMinatBakatService.peserta.start(record.id),
          successMessage: 'Tes berhasil dimulai',
        })
      }

      if (record.status === 2) {
        actions.push({
          label: 'Selesaikan Tes',
          variant: 'primary',
          action: async () => await tesMinatBakatService.peserta.complete(record.id),
          successMessage: 'Tes berhasil diselesaikan',
        })
      }

      return actions
    },
    getDeleteLabel: (record) => `peserta "${record.siswa?.nama || record.nomor_peserta || record.id}"`,
  },
  jawaban: {
    key: 'jawaban',
    segment: 'jawaban',
    icon: FileText,
    navTitle: 'Jawaban',
    navDescription: 'Kelola jawaban peserta untuk setiap pertanyaan dalam satu sesi tes.',
    listTitle: 'Jawaban Tes Minat dan Bakat',
    searchPlaceholder: 'Cari jawaban peserta...',
    endpoint: '/akademik/tes-minat-bakat-jawaban/',
    basePath: '/akademik/tes-minat-bakat/jawaban',
    service: tesMinatBakatService.jawaban,
    fields: [
      { name: 'trx_tes_minat_bakat_peserta_id', label: 'Peserta', type: 'select', optionsKey: 'peserta', valueType: 'integer', required: true, placeholder: 'Pilih peserta' },
      { name: 'mst_tes_minat_bakat_pertanyaan_id', label: 'Pertanyaan', type: 'select', optionsKey: 'pertanyaan', valueType: 'integer', required: true, placeholder: 'Pilih pertanyaan' },
      { name: 'mst_tes_minat_bakat_opsi_id', label: 'Opsi Jawaban', type: 'select', optionsKey: 'opsi', valueType: 'integer', placeholder: 'Pilih opsi jawaban' },
      { name: 'skor', label: 'Skor', type: 'number', valueType: 'number', placeholder: '0.00' },
      { name: 'jawaban_teks', label: 'Jawaban Teks', type: 'textarea', span: 2, rows: 4, placeholder: 'Jawaban dalam bentuk teks' },
    ],
    optionLoaders: {
      peserta: async () => await loadOptions(
        tesMinatBakatService.peserta.getAll,
        (item) => ({ value: item.id, label: `${item.siswa?.nama || `Peserta #${item.id}`} - ${item.tes?.nama || 'Tanpa tes'}` })
      ),
      pertanyaan: async () => await loadOptions(
        tesMinatBakatService.pertanyaan.getAll,
        (item) => ({ value: item.id, label: `${item.urutan || '-'} - ${String(item.pertanyaan || '').slice(0, 80)}` })
      ),
    },
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      {
        headerName: 'Peserta',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.peserta?.siswa?.nama || '-',
      },
      {
        headerName: 'Tes',
        minWidth: 170,
        flex: 1,
        cellRenderer: (params) => params.data?.peserta?.tes?.nama || '-',
      },
      {
        headerName: 'Pertanyaan',
        minWidth: 260,
        flex: 2,
        cellRenderer: (params) => params.data?.pertanyaan?.pertanyaan || '-',
      },
      {
        headerName: 'Opsi',
        minWidth: 130,
        cellRenderer: (params) => getOpsiDisplay(params.data?.opsi, params.data?.mst_tes_minat_bakat_opsi_id || '-'),
      },
      { field: 'skor', headerName: 'Skor', minWidth: 100 },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Jawaban',
        fields: [
          { label: 'Peserta', value: (record) => getName(record.peserta?.siswa?.nama) },
          { label: 'Tes', value: (record) => getName(record.peserta?.tes?.nama) },
          { label: 'Pertanyaan', value: (record) => getName(record.pertanyaan?.pertanyaan) },
          { label: 'Opsi', value: (record) => getOpsiDisplay(record.opsi, record.mst_tes_minat_bakat_opsi_id || '-') },
          { label: 'Jawaban Teks', value: (record) => getName(record.jawaban_teks) },
          { label: 'Skor', value: (record) => record.skor ?? '-' },
        ],
      },
    ],
    summary: (record) => ({
      title: record.peserta?.siswa?.nama || 'Jawaban Peserta',
      subtitle: record.pertanyaan?.pertanyaan || 'Tanpa pertanyaan',
      badge: makeBadge(`Skor ${record.skor ?? 0}`, 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'),
    }),
    getDeleteLabel: (record) => `jawaban peserta "${record.peserta?.siswa?.nama || record.id}"`,
  },
  hasil: {
    key: 'hasil',
    segment: 'hasil',
    icon: BarChart3,
    navTitle: 'Hasil',
    navDescription: 'Lihat hasil akhir peserta per aspek, kategori, dan rekomendasi.',
    listTitle: 'Hasil Tes Minat dan Bakat',
    searchPlaceholder: 'Cari hasil tes...',
    endpoint: '/akademik/tes-minat-bakat-hasil/',
    basePath: '/akademik/tes-minat-bakat/hasil',
    service: tesMinatBakatService.hasil,
    fields: [
      { name: 'trx_tes_minat_bakat_peserta_id', label: 'Peserta', type: 'select', optionsKey: 'peserta', valueType: 'integer', required: true, placeholder: 'Pilih peserta' },
      { name: 'mst_tes_minat_bakat_aspek_id', label: 'Aspek', type: 'select', optionsKey: 'aspek', valueType: 'integer', required: true, placeholder: 'Pilih aspek' },
      { name: 'skor', label: 'Skor', type: 'number', valueType: 'number', required: true, placeholder: '0.00' },
      { name: 'persentase', label: 'Persentase', type: 'number', valueType: 'number', placeholder: '0 - 100' },
      { name: 'kategori_hasil', label: 'Kategori Hasil', type: 'text', placeholder: 'Dominan / Cukup / Rendah' },
      { name: 'deskripsi_hasil', label: 'Deskripsi Hasil', type: 'textarea', span: 2, rows: 3, placeholder: 'Deskripsi hasil' },
      { name: 'rekomendasi', label: 'Rekomendasi', type: 'textarea', span: 2, rows: 3, placeholder: 'Rekomendasi tindak lanjut' },
    ],
    optionLoaders: {
      peserta: async () => await loadOptions(
        tesMinatBakatService.peserta.getAll,
        (item) => ({ value: item.id, label: `${item.siswa?.nama || `Peserta #${item.id}`} - ${item.tes?.nama || 'Tanpa tes'}` })
      ),
      aspek: async () => await loadOptions(
        tesMinatBakatService.aspek.getAll,
        (item) => ({ value: item.id, label: item.nama_aspek || item.kode_aspek || `Aspek #${item.id}` })
      ),
    },
    buildColumns: ({ handleDetail, handleEdit, handleDelete, ActionsMenu }) => [
      {
        headerName: 'Peserta',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.peserta?.siswa?.nama || '-',
      },
      {
        headerName: 'Aspek',
        minWidth: 180,
        flex: 1,
        cellRenderer: (params) => params.data?.aspek?.nama_aspek || '-',
      },
      { field: 'skor', headerName: 'Skor', minWidth: 100 },
      {
        field: 'persentase',
        headerName: 'Persentase',
        minWidth: 120,
        cellRenderer: (params) => params.value != null ? `${params.value}%` : '-',
      },
      { field: 'kategori_hasil', headerName: 'Kategori', minWidth: 140 },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
            />
          </div>
        ),
      },
    ],
    detailSections: [
      {
        title: 'Informasi Hasil',
        fields: [
          { label: 'Peserta', value: (record) => getName(record.peserta?.siswa?.nama) },
          { label: 'Tes', value: (record) => getName(record.peserta?.tes?.nama) },
          { label: 'Aspek', value: (record) => getName(record.aspek?.nama_aspek) },
          { label: 'Skor', value: (record) => record.skor ?? '-' },
          { label: 'Persentase', value: (record) => record.persentase != null ? `${record.persentase}%` : '-' },
          { label: 'Kategori Hasil', value: (record) => getName(record.kategori_hasil) },
          { label: 'Deskripsi Hasil', value: (record) => getName(record.deskripsi_hasil) },
          { label: 'Rekomendasi', value: (record) => getName(record.rekomendasi) },
        ],
      },
    ],
    summary: (record) => ({
      title: record.peserta?.siswa?.nama || 'Hasil Tes',
      subtitle: record.aspek?.nama_aspek || 'Tanpa aspek',
      badge: makeBadge(record.kategori_hasil || 'Tanpa kategori', 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'),
    }),
    getDeleteLabel: (record) => `hasil peserta "${record.peserta?.siswa?.nama || record.id}"`,
  },
}

export const tesMinatBakatResourceOrder = ['tes', 'aspek', 'pertanyaan', 'peserta', 'jawaban', 'hasil']

export const normalizeIn = (resourceKey, record) => {
  const normalized = defaultNormalizeIn(tesMinatBakatResources[resourceKey].fields, record)

  if (resourceKey === 'pertanyaan') {
    normalized.opsi = Array.isArray(record?.opsi)
      ? record.opsi.map((opsi) => ({
          id: opsi.id,
          label: opsi.label ?? '',
          teks_opsi: opsi.teks_opsi ?? '',
          skor: opsi.skor ?? '',
          urutan: opsi.urutan ?? '',
          mst_tes_minat_bakat_aspek_id: opsi.mst_tes_minat_bakat_aspek_id ?? record?.mst_tes_minat_bakat_aspek_id ?? '',
        }))
      : []
  }

  return normalized
}

export const normalizeOut = (resourceKey, formData) => {
  const normalized = defaultNormalizeOut(tesMinatBakatResources[resourceKey].fields, formData)

  if (resourceKey === 'pertanyaan') {
    normalized.opsi = Array.isArray(formData?.opsi)
      ? formData.opsi
        .map((opsi) => ({
          ...(opsi.id ? { id: opsi.id } : {}),
          label: opsi.label?.trim() || '',
          teks_opsi: opsi.teks_opsi?.trim() || '',
          skor: toFloat(opsi.skor),
          urutan: toInteger(opsi.urutan),
          mst_tes_minat_bakat_aspek_id: toInteger(opsi.mst_tes_minat_bakat_aspek_id),
        }))
        .filter((opsi) => opsi.label || opsi.teks_opsi || opsi.skor !== null)
      : []
  }

  return normalized
}