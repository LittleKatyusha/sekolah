# Laporan Ketidakcocokan Field API (Backend ↔ Frontend)

> Tanggal evaluasi: 14 Maret 2026  
> Backend: `/Users/bodo/www/sekolah/src` (Laravel)  
> Frontend: `/Users/bodo/www/sekolah_fe/src` (React)

---

## Daftar Isi

1. [🔴 Bug Backend — Field Selalu null](#1-bug-backend--field-selalu-null)
2. [🔴 Bug Form Edit — refLabel Code vs Label](#2-bug-form-edit--reflabel-code-vs-label)
3. [🟠 Field Nama Salah / Tidak Ada di Response](#3-field-nama-salah--tidak-ada-di-response)
4. [🟡 Label Hardcode Tidak Cocok dengan SysReference](#4-label-hardcode-tidak-cocok-dengan-sysreference)
5. [Ringkasan](#ringkasan)

---

## 1. Bug Backend — Field Selalu null

> Data **selalu null** karena resource PHP mengakses properti model yang tidak ada.

---

### 1.1 RaporResource — `mapel.kode` dan `mapel.nama` null

**File backend:** `app/Http/Resources/Api/V1/RaporResource.php`

```php
// ❌ SALAH — MstMapel tidak punya kolom `kode` maupun `nama`
'kode' => $d->mapel->kode,
'nama' => $d->mapel->nama,

// ✅ BENAR
'kode' => $d->mapel->kode_mapel,
'nama' => $d->mapel->nama_mapel,
```

**Dampak frontend:**  
`src/features/rapor/pages/RaporDetail.jsx` baris 228–229:
```jsx
<td>{d.mapel?.kode || '-'}</td>   // selalu tampil '-'
<td>{d.mapel?.nama || '-'}</td>   // selalu tampil '-'
```

---

### 1.2 JadwalPelajaranResource — `mapel.nama` null

**File backend:** `app/Http/Resources/Api/V1/JadwalPelajaranResource.php`

```php
// ❌ SALAH — MstMapel tidak punya kolom `nama`
'nama' => $this->guruMapel->mapel->nama,

// ✅ BENAR
'nama' => $this->guruMapel->mapel->nama_mapel,
```

**Dampak frontend:**  
`src/features/jadwal-pelajaran/pages/JadwalPelajaranList.jsx` — kolom Mata Pelajaran selalu kosong.

---

## 2. Bug Form Edit — refLabel Code vs Label

> **Akar masalah:** `BaseResource::refLabel()` mengembalikan **label** (e.g. `"Laki-Laki"`),  
> sedangkan `useReferenceOptions()` mengisi select dengan **kode** sebagai value (e.g. `"1"`).  
>  
> Akibatnya saat mode edit:
> - Dropdown tidak terpilih (nilai API tidak cocok dengan value option)
> - Saat submit, `parseInt("Laki-Laki")` = `NaN` → data tersimpan null/rusak

---

### 2.1 GuruResource — jenis_kelamin, agama, pendidikan_terakhir

**File backend:** `app/Http/Resources/Api/V1/GuruResource.php`

```php
// API mengembalikan LABEL, bukan kode
'jenis_kelamin'      => $this->refLabel('jenis_kelamin', $this->jenis_kelamin),
'agama'              => $this->refLabel('agama', $this->agama),
'pendidikan_terakhir'=> $this->refLabel('pendidikan_terakhir', $this->pendidikan_terakhir),
```

**File frontend:** `src/features/guru/pages/GuruForm.jsx`

```jsx
// Form pre-populate dari API response
jenis_kelamin: guru.jenis_kelamin || 'Laki-Laki',  // API: "Laki-Laki", option value: "1" → blank
agama:         guru.agama || '',                    // API: "Islam", option value: "1" → blank
pendidikan_terakhir: guru.pendidikan_terakhir || '' // API: "SMA / ...", option value: "3" → blank
```

**Fix yang diperlukan pada backend:**
```php
// ✅ Kembalikan kode numerik, bukan label
'jenis_kelamin'      => $this->jenis_kelamin,
'agama'              => $this->agama,
'pendidikan_terakhir'=> $this->pendidikan_terakhir,
```

---

### 2.2 SiswaResource — jenis_kelamin, agama, status

**File backend:** `app/Http/Resources/Api/V1/SiswaResource.php`

```php
// API mengembalikan LABEL
'jenis_kelamin' => $this->refLabel('jenis_kelamin', $this->jenis_kelamin),
'agama'         => $this->refLabel('agama', $this->agama),
'status'        => $this->refLabel('status_siswa', $this->status),
```

**File frontend:** `src/features/siswa/pages/SiswaForm.jsx`

```jsx
// Select options gunakan kode
const STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif' },   // hardcode string, API: "Aktif" → cocok (kebetulan)
  ...
]

// Tapi jenis_kelamin dan agama pakai kode numerik via useReferenceOptions → tidak cocok
jenis_kelamin: siswa.jenis_kelamin || 'Laki-Laki', // API: "Laki-Laki", option value: "1" → blank
agama:         siswa.agama || '',                   // API: "Islam", option value: "1" → blank
```

**Fix yang diperlukan pada backend:**
```php
// ✅ Kembalikan kode numerik
'jenis_kelamin' => $this->jenis_kelamin,
'agama'         => $this->agama,
'status'        => $this->status,
```

---

### 2.3 UjianResource — jenis, semester

**File backend:** `app/Http/Resources/Api/V1/UjianResource.php`

```php
// API mengembalikan LABEL
'jenis'    => $this->refLabel('jenis_ujian', $this->jenis),       // → "Harian"
'semester' => $this->refLabel('kategori_semester', $this->semester), // → "ganjil"
```

**File frontend:** `src/features/ujian/pages/UjianForm.jsx`

```jsx
// Pre-populate
jenis:    String(ujian.jenis) || '',    // String("Harian") → option value "1" → blank
semester: String(ujian.semester) || '', // String("ganjil") → option value "1" → blank

// Submit
jenis:    parseInt(formData.jenis),    // parseInt("Harian") = NaN ← DATA RUSAK
semester: parseInt(formData.semester), // parseInt("ganjil") = NaN ← DATA RUSAK
```

**Fix yang diperlukan pada backend:**
```php
// ✅ Kembalikan kode numerik
'jenis'    => $this->jenis,
'semester' => $this->semester,
```

---

### 2.4 PembayaranSppResource — status, metode_pembayaran

**File backend:** `app/Http/Resources/Api/V1/PembayaranSppResource.php`

```php
// API mengembalikan LABEL
'status'            => $this->refLabel('status_bayar', $this->status),
'metode_pembayaran' => $this->refLabel('metode_pembayaran', $this->metode_pembayaran),
```

**File frontend:** `src/features/spp/pages/PembayaranSppForm.jsx`

```jsx
// Pre-populate
status:            String(p.status),            // String("Lunas") → option value "2" → blank
metode_pembayaran: String(p.metode_pembayaran), // String("Tunai") → option value "1" → blank

// Submit
status:            parseInt(formData.status),            // parseInt("Lunas") = NaN ← DATA RUSAK
metode_pembayaran: parseInt(formData.metode_pembayaran), // parseInt("Tunai") = NaN ← DATA RUSAK
```

**Fix yang diperlukan pada backend:**
```php
// ✅ Kembalikan kode numerik
'status'            => $this->status,
'metode_pembayaran' => $this->metode_pembayaran,
```

---

## 3. Field Nama Salah / Tidak Ada di Response

---

### 3.1 TugasSiswa — `tanggal_kumpul` vs `waktu_kumpl`

**Backend field (benar):** `waktu_kumpl`  
**Frontend field (salah):** `tanggal_kumpul`

| File | Masalah |
|------|---------|
| `src/features/tugas/pages/TugasSiswaList.jsx:201` | `field: 'tanggal_kumpul'` → kolom kosong |
| `src/features/tugas/pages/TugasSiswaDetail.jsx:252` | `tugasSiswa.tanggal_kumpul` → undefined |
| `src/features/tugas/pages/TugasSiswaForm.jsx:128` | `tanggal_kumpul: formData.tanggal_kumpul` → field tidak tersimpan ke DB |
| `src/features/tugas/pages/TugasDetail.jsx:322` | `submission.tanggal_kumpul` → undefined |

**Fix (semua file frontend):** Ganti `tanggal_kumpul` → `waktu_kumpl`

---

### 3.2 SoalDetail — `opsi.opsi` dan `opsi.is_correct`

**Backend response (benar):**
```json
{ "opsi_teks": "...", "is_benar": true }
```

**Frontend akses (salah):**  
`src/features/soal/pages/SoalDetail.jsx` baris 250, 257, 264–265:
```jsx
opsi.is_correct  // ❌ → undefined, seharusnya opsi.is_benar
opsi.opsi        // ❌ → undefined, seharusnya opsi.opsi_teks
```

**Fix frontend:**
```jsx
// ✅ BENAR
opsi.is_benar
opsi.opsi_teks
```

---

### 3.3 SoalList — `mapel_nama` tidak ada di response

**Backend response:** `mapel: { id, nama }` (nested object)

**Frontend (`src/features/soal/pages/SoalList.jsx:227`):**
```jsx
// ❌ Field flat tidak ada
{ field: 'mapel_nama', headerName: 'Mata Pelajaran' }

// ✅ BENAR — gunakan valueGetter
{
  headerName: 'Mata Pelajaran',
  valueGetter: (params) => params.data?.mapel?.nama || '-'
}
```

---

### 3.4 LogAksesMat eri — `siswa.nama_lengkap`

**Backend response:** `siswa: { id, nis, nama }` (field: `nama`, bukan `nama_lengkap`)

| File | Masalah |
|------|---------|
| `src/features/log-akses-materi/pages/LogAksesMateriList.jsx:78` | `p.data?.siswa?.nama_lengkap` → undefined |
| `src/features/log-akses-materi/pages/LogAksesMateriDetail.jsx:59` | `data.siswa?.nama_lengkap` → undefined |

**Fix frontend:** Ganti `nama_lengkap` → `nama`

---

### 3.5 Buku — 3 field tidak ada di database maupun resource

**Kolom database aktual** (`mst_buku`): `isbn`, `judul`, `penulis`, `penerbit`, `tahun`, `stok`

| Field frontend | Field backend | Status |
|---|---|---|
| `tahun_terbit` | `tahun` | ❌ nama berbeda |
| `jumlah_halaman` | *(tidak ada)* | ❌ tidak ada di DB |
| `deskripsi` | *(tidak ada)* | ❌ tidak ada di DB |

**File terpengaruh:**
- `src/features/perpustakaan/pages/BukuList.jsx` — kolom selalu kosong
- `src/features/perpustakaan/pages/BukuForm.jsx` — input tidak tersimpan
- `src/features/perpustakaan/pages/BukuDetail.jsx` — data selalu kosong

**Solusi (pilih salah satu):**
- **Opsi A (Backend):** Tambah kolom `tahun_terbit`, `jumlah_halaman`, `deskripsi` ke tabel & resource
- **Opsi B (Frontend):** Sesuaikan frontend menggunakan field `tahun`, hapus `jumlah_halaman` & `deskripsi`

---

### 3.6 Roles & Permissions — `guard_name` tidak ada di response

**Backend resource:** `RoleResource` dan `PermissionResource` tidak mengembalikan `guard_name`.

**File terpengaruh:**

| File | Baris | Masalah |
|------|-------|---------|
| `src/features/roles/pages/RolesList.jsx` | 127 | `field: 'guard_name'` → kolom kosong |
| `src/features/roles/pages/PermissionsList.jsx` | 127 | `field: 'guard_name'` → kolom kosong |
| `src/features/roles/pages/RolesForm.jsx` | 48, 99 | `role.guard_name`, submit `guard_name` |
| `src/features/roles/pages/RolesDetail.jsx` | 104, 146 | `role.guard_name` → undefined |
| `src/features/roles/pages/PermissionsForm.jsx` | 38, 70 | `permission.guard_name` |
| `src/features/roles/pages/PermissionsDetail.jsx` | 94, 130 | `permission.guard_name` → undefined |

**Fix (pilih salah satu):**
- **Opsi A (Backend):** Tambahkan `'guard_name' => $this->guard_name` di `RoleResource` dan `PermissionResource`
- **Opsi B (Frontend):** Hapus kolom & field `guard_name` dari semua file (nilai selalu `"web"`)

---

## 4. Label Hardcode Tidak Cocok dengan SysReference

---

### 4.1 PembayaranSppForm — STATUS_OPTIONS tidak sesuai DB

`src/features/spp/pages/PembayaranSppForm.jsx`

| Value | Label Frontend | `sys_references.nama` (DB) | Status |
|---|---|---|---|
| `'1'` | Belum Bayar | **Lunas** | ❌ |
| `'2'` | Lunas | **Belum Lunas** | ❌ |
| `'3'` | Cicilan | **Pending** | ❌ |
| `'4'` | Dispensasi | **Batal** | ❌ |

**METODE_OPTIONS:**

| Value | Label Frontend | `sys_references.nama` (DB) | Status |
|---|---|---|---|
| `'1'` | Tunai | Tunai | ✅ |
| `'2'` | Transfer Bank | Transfer | ⚠️ |
| `'3'` | E-Wallet | **Virtual Account** | ❌ |
| `'4'` | Lainnya | **QRIS** | ❌ |

**Fix:** Sesuaikan label dengan data `sys_references`:
```jsx
const STATUS_OPTIONS = [
  { value: '1', label: 'Lunas' },
  { value: '2', label: 'Belum Lunas' },
  { value: '3', label: 'Pending' },
  { value: '4', label: 'Batal' },
]

const METODE_OPTIONS = [
  { value: '1', label: 'Tunai' },
  { value: '2', label: 'Transfer' },
  { value: '3', label: 'Virtual Account' },
  { value: '4', label: 'QRIS' },
]
```

---

### 4.2 BkKasusForm — statusStringToInt mapping salah

`src/features/bk/pages/BkKasusForm.jsx` baris 20–25

| Kode | `statusStringToInt` key (frontend) | `sys_references.nama` (DB) | Status |
|---|---|---|---|
| 1 | `'dibuka'` | `'dibuka'` | ✅ |
| 2 | `'dalam_proses'` | **`'proses'`** | ❌ |
| 3 | `'selesai'` | `'selesai'` | ✅ |
| 4 | `'ditutup'` | **`'dirujuk'`** | ❌ |

Konversi balik dari label ke integer gagal untuk status 2 dan 4, sehingga saat edit status tersebut tidak bisa dipilih.

**Fix:**
```jsx
const statusStringToInt = {
  'dibuka':  1,
  'proses':  2,  // ✅ bukan 'dalam_proses'
  'selesai': 3,
  'dirujuk': 4,  // ✅ bukan 'ditutup'
}
```

---

## Ringkasan

| # | Severity | Modul | Jenis Masalah | File Backend | File Frontend |
|---|---|---|---|---|---|
| 1 | 🔴 Kritis | Rapor | Backend bug: mapel.kode/nama null | `RaporResource.php` | `RaporDetail.jsx` |
| 2 | 🔴 Kritis | JadwalPelajaran | Backend bug: mapel.nama null | `JadwalPelajaranResource.php` | `JadwalPelajaranList.jsx` |
| 3 | 🔴 Kritis | Guru | refLabel → form edit blank + submit NaN | `GuruResource.php` | `GuruForm.jsx` |
| 4 | 🔴 Kritis | Siswa | refLabel → form edit blank | `SiswaResource.php` | `SiswaForm.jsx` |
| 5 | 🔴 Kritis | Ujian | refLabel → form edit blank + submit NaN | `UjianResource.php` | `UjianForm.jsx` |
| 6 | 🔴 Kritis | SPP | refLabel → form edit blank + submit NaN | `PembayaranSppResource.php` | `PembayaranSppForm.jsx` |
| 7 | 🟠 Tinggi | TugasSiswa | `tanggal_kumpul` vs `waktu_kumpl` | `TugasSiswaResource.php` | `TugasSiswaList/Detail/Form.jsx` |
| 8 | 🟠 Tinggi | Soal | `opsi.opsi` / `opsi.is_correct` salah | `SoalResource.php` | `SoalDetail.jsx` |
| 9 | 🟠 Tinggi | Soal | `mapel_nama` flat field tidak ada | `SoalResource.php` | `SoalList.jsx` |
| 10 | 🟠 Tinggi | LogAksesMat eri | `siswa.nama_lengkap` vs `siswa.nama` | `LogAksesMateriResource.php` | `LogAksesMateriList/Detail.jsx` |
| 11 | 🟠 Tinggi | Perpustakaan | `tahun_terbit`, `jumlah_halaman`, `deskripsi` tidak ada di DB | `BukuResource.php` | `BukuList/Form/Detail.jsx` |
| 12 | 🟠 Tinggi | Roles | `guard_name` tidak di-return resource | `RoleResource.php`, `PermissionResource.php` | `RolesList/Form/Detail.jsx` |
| 13 | 🟡 Menengah | SPP | Label STATUS_OPTIONS & METODE_OPTIONS tidak sesuai DB | *(sys_references)* | `PembayaranSppForm.jsx` |
| 14 | 🟡 Menengah | BK | `statusStringToInt` key salah | *(sys_references)* | `BkKasusForm.jsx` |

**Total: 14 ketidakcocokan** — 6 kritis, 6 tinggi, 2 menengah
