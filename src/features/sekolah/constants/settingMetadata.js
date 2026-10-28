import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  BookOpen,
  Globe,
  Award,
  UserCheck,
  AlertTriangle,
  Lock,
  DollarSign,
  Sliders,
  Settings,
} from 'lucide-react'

export const SETTING_METADATA = {
  tahun_ajaran_aktif: {
    label: 'Tahun Ajaran Aktif',
    category: 'akademik',
    description: 'Tahun ajaran akademik yang sedang aktif berjalan',
    icon: Calendar,
  },
  semester_aktif: {
    label: 'Semester Aktif',
    category: 'akademik',
    description: 'Semester berjalan (1 = Ganjil, 2 = Genap)',
    icon: Clock,
  },
  max_sks_per_hari: {
    label: 'Maks. SKS / Jam Belajar per Hari',
    category: 'akademik',
    description: 'Alokasi maksimum jam pelajaran siswa per hari',
    icon: BookOpen,
  },
  jam_masuk_sekolah: {
    label: 'Jam Masuk Sekolah',
    category: 'akademik',
    description: 'Batas awal jam kehadiran siswa reguler',
    icon: Clock,
  },
  jam_pulang_sekolah: {
    label: 'Jam Pulang Sekolah',
    category: 'akademik',
    description: 'Waktu selesai kegiatan pembelajaran reguler',
    icon: Clock,
  },
  toleransi_keterlambatan_menit: {
    label: 'Toleransi Keterlambatan (Menit)',
    category: 'akademik',
    description: 'Batas dispensasi waktu sebelum ditandai terlambat',
    icon: Clock,
  },
  lokasi_sekolah_latitude: {
    label: 'Latitude Titik Sekolah',
    category: 'lokasi',
    description: 'Koordinat lintang gedung/gerbang sekolah',
    icon: MapPin,
  },
  lokasi_sekolah_longitude: {
    label: 'Longitude Titik Sekolah',
    category: 'lokasi',
    description: 'Koordinat bujur gedung/gerbang sekolah',
    icon: MapPin,
  },
  radius_absensi_meter: {
    label: 'Radius Absensi (Meter)',
    category: 'lokasi',
    description: 'Batas toleransi radius absensi GPS dari titik sekolah',
    icon: Shield,
  },
  ppdb_gelombang_aktif: {
    label: 'Gelombang PPDB Aktif',
    category: 'layanan',
    description: 'Gelombang penerimaan peserta didik baru (PPDB) yang sedang dibuka',
    icon: BookOpen,
  },
  biaya_denda_perpustakaan_per_hari: {
    label: 'Denda Perpustakaan per Hari',
    category: 'layanan',
    description: 'Besaran denda keterlambatan buku per hari (Rp)',
    icon: DollarSign,
  },
  timezone: {
    label: 'Zona Waktu Sistem',
    category: 'sistem',
    description: 'Zona waktu server dan absensi (misal: Asia/Jakarta)',
    icon: Globe,
  },
  format_tanggal: {
    label: 'Format Tanggal',
    category: 'sistem',
    description: 'Format standar tanggal sistem (misal: d-m-Y)',
    icon: Calendar,
  },
  versi_rapor: {
    label: 'Versi Format Rapor',
    category: 'sistem',
    description: 'Versi mesin atau template cetak rapor siswa',
    icon: Award,
  },
  kepala_sekolah_user_id: {
    label: 'Akun Kepala Sekolah',
    category: 'sistem',
    description: 'ID user akun kepala sekolah penandatangan dokumen',
    icon: UserCheck,
  },
  maintenance_mode: {
    label: 'Mode Pemeliharaan (Maintenance)',
    category: 'sistem',
    description: '0 = Normal (Akses dibuka), 1 = Pemeliharaan Aktif',
    icon: AlertTriangle,
  },
  default_password: {
    label: 'Password Default Akun Baru',
    category: 'sistem',
    description: 'Kata sandi bawaan ketika membuat akun pengguna baru',
    icon: Lock,
  },
}

export const CATEGORIES = [
  { id: 'all', label: 'Semua Pengaturan', icon: Settings },
  { id: 'akademik', label: 'Akademik & Waktu', icon: Calendar, description: 'Tahun ajaran, semester, jam pelajaran & toleransi kehadiran' },
  { id: 'lokasi', label: 'Kehadiran & Geofence', icon: MapPin, description: 'Titik koordinat GPS dan batasan radius absensi' },
  { id: 'layanan', label: 'PPDB & Fasilitas', icon: BookOpen, description: 'Gelombang PPDB aktif dan denda perpustakaan' },
  { id: 'sistem', label: 'Sistem & Rapor', icon: Shield, description: 'Timezone, format tanggal, versi rapor, maintenance & pimpinan' },
  { id: 'custom', label: 'Lainnya', icon: Sliders, description: 'Pengaturan kustom tambahan' },
]
