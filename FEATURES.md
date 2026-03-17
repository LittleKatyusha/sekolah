# SekolahPintar Admin — Feature Map

**Stack:** React 19, Vite, Tailwind CSS, React Router v7, Zustand, Axios, Recharts, AG Grid, Lexical, SweetAlert2

---

## Access Roles
| Role ID | Name |
|---------|------|
| 1 | admin |
| 2 | guru |
| 3 | staff |
| 4 | siswa |
| — | petugas_perpustakaan |

---

## Feature Modules

### Dashboard
- **Route:** `/dashboard`
- **Access:** All authenticated users
- **Pages:** `src/features/dashboard/`
- Quick actions per role (admin, guru, siswa, wali)

---

### Siswa (Students)
- **Route:** `/siswa/*`
- **Access:** admin, guru
- **Pages:** `src/features/siswa/pages/` — List, Form, Detail

---

### Kelas (Classes)
- **Route:** `/kelas/*`
- **Access:** admin, guru
- **Pages:** `src/features/kelas/pages/` — List, Form, Detail

---

### Guru (Teachers)
- **Route:** `/guru/*`
- **Access:** admin only
- **Pages:** `src/features/guru/pages/` — List, Form, Detail

---

### Wali (Guardians)
- **Route:** `/wali/*`
- **Access:** admin only
- **Pages:** `src/features/wali/pages/` — List, Form, Detail

---

### Mapel (Subjects)
- **Route:** `/mapel/*`
- **Access:** admin only
- **Pages:** `src/features/mapel/` — List, Form, Detail

---

### Absensi Siswa (Student Attendance)
- **Route:** `/absensi-siswa/*`
- **Access:** admin, guru
- **Pages:** `src/features/absensi-siswa/pages/` — List, Form (tambah/edit), Detail

---

### Absensi Guru (Teacher Attendance)
- **Route:** `/absensi-guru/*`
- **Access:** admin, guru
- **Pages:** `src/features/absensi-guru/pages/` — List, Form (tambah/edit), Detail

---

## Akademik Group

### Nilai (Grades)
- **Route:** `/akademik/nilai/*`
- **Access:** admin, guru
- **Pages:** `src/features/nilai/pages/` — List, Form, Detail

### Tugas (Assignments)
- **Route:** `/akademik/tugas/*`
- **Access:** admin, guru
- **Pages:** `src/features/tugas/pages/` — List, Form, Detail

### Tugas Siswa (Student Assignment Submissions)
- **Route:** `/akademik/tugas-siswa/*`
- **Access:** admin, guru
- **Pages:** `src/features/tugas/pages/TugasSiswa*` — List, Form, Detail

### Ranking
- **Route:** `/akademik/ranking/*`
- **Access:** admin, guru
- **Pages:** `src/features/ranking/pages/` — List, Form, Detail

### Rapor (Report Cards)
- **Route:** `/akademik/rapor/*`
- **Access:** admin, guru
- **Pages:** `src/features/rapor/pages/` — List, Form, Detail

### Forum
- **Route:** `/akademik/forum/*`
- **Access:** All roles (admin, guru, staff, siswa)
- **Pages:** `src/features/forum/pages/` — List, Form, Detail

### Materi (Learning Materials)
- **Route:** `/akademik/materi/*`
- **Access:** admin, guru
- **Pages:** `src/features/materi/pages/` — List, Form, Detail

### Presensi (Attendance per Session)
- **Route:** `/akademik/presensi/*`
- **Access:** admin, guru
- **Pages:** `src/features/presensi/pages/` — List, Form (tambah/edit), Detail

### Log Akses Materi (Material Access Log)
- **Route:** `/akademik/log-akses-materi/*`
- **Access:** admin, guru
- **Pages:** `src/features/log-akses-materi/pages/` — List, Detail

### Ujian (Exams)
- **Route:** `/akademik/ujian/*`
- **Access:** admin, guru
- **Pages:** `src/features/ujian/pages/` — List, Form, Detail, Nilai view

### Soal / Bank Soal (Question Bank)
- **Route:** `/akademik/soals/*`
- **Access:** admin, guru
- **Pages:** `src/features/soal/pages/` — List, Form, Detail

### Ujian Jawaban (Exam Answers)
- **Route:** `/akademik/ujian-jawaban/*`
- **Access:** admin, guru
- **Pages:** `src/features/ujian-jawaban/pages/` — List, Detail, Form (edit)

### Ujian User (Student Exam Sessions)
- **Route:** `/akademik/ujian-user/*`
- **Access:** admin, guru
- **Pages:** `src/features/ujian-user/pages/` — List, Form, Detail, Mulai (start exam)

### Jadwal Pelajaran (Class Schedule)
- **Route:** `/jadwal-pelajaran/*`
- **Access:** admin, guru
- **Pages:** `src/features/jadwal-pelajaran/pages/` — List, Form, Detail

---

## Admin Group

### Tahun Ajaran (Academic Year)
- **Route:** `/admin/tahun-ajaran/*`
- **Access:** admin only
- **Pages:** `src/features/tahun-ajaran/pages/` — List, Form, Detail

### Semester
- **Route:** `/admin/semester/*`
- **Access:** admin only
- **Pages:** `src/features/semester/pages/` — List, Form, Detail

### Kalender Akademik (Academic Calendar)
- **Route:** `/admin/kalender-akademik/*`
- **Access:** admin, guru
- **Pages:** `src/features/kalender-akademik/pages/` — List, Form, Detail

### Kalender Harian (Daily Calendar)
- **Route:** `/admin/kalender-harian`
- **Access:** admin only
- **Pages:** `src/features/kalender-harian/`

### Kalender Tipe (Calendar Event Types)
- **Route:** `/admin/kalender-tipe/*`
- **Access:** admin only
- **Pages:** `src/features/kalender-tipe/pages/` — List, Form (create/edit)

### Hari Operasional (Operating Days)
- **Route:** `/admin/hari-operasional`
- **Access:** admin only
- **Pages:** `src/features/hari-operasional/`

### References (Master Data References)
- **Route:** `/admin/references/*`
- **Access:** admin only
- **Pages:** `src/features/references/pages/` — List, Form, Detail

### Roles
- **Route:** `/admin/roles/*`
- **Access:** admin only
- **Pages:** `src/features/roles/pages/RolesList`, `RolesForm`, `RolesDetail`

### Permissions
- **Route:** `/admin/permissions/*`
- **Access:** admin only
- **Pages:** `src/features/roles/pages/PermissionsList`, `PermissionsForm`, `PermissionsDetail`

### Role Permissions
- **Route:** `/admin/role-permissions/*`
- **Access:** admin only
- **Pages:** `src/features/roles/pages/RolePermissionsList`, `RolePermissionsForm`, `RolePermissionsDetail`

### Users
- **Route:** `/admin/users/*`
- **Access:** admin only
- **Pages:** `src/features/users/pages/` — List, Form, Detail

### Menus (Dynamic Sidebar Menus)
- **Route:** `/admin/menus/*`
- **Access:** admin only
- **Pages:** `src/features/menus/pages/` — List, Form, Detail
- Menu tree loaded dynamically from `/api/v1/admin/menus/tree/`

### Activity Logs
- **Route:** `/admin/activity-logs/*`
- **Access:** admin only
- **Pages:** `src/features/activity-logs/pages/` — List, Detail

### Files (File Manager)
- **Route:** `/files`
- **Access:** admin only
- **Pages:** `src/features/files/`

---

## Keuangan (Finance) Group

### Tarif SPP (SPP Rate)
- **Route:** `/keuangan/tarif-spp/*`
- **Access:** admin only
- **Pages:** `src/features/spp/pages/TarifSpp*` — List, Form, Detail

### Pembayaran SPP (SPP Payment)
- **Route:** `/keuangan/pembayaran-spp/*`
- **Access:** admin only
- **Pages:** `src/features/spp/pages/PembayaranSpp*` — List, Form, Detail

---

## BK (Bimbingan Konseling / Counseling) Module

All BK sub-features follow the pattern: **List → Detail → Form (create/edit)**

- **Access:** admin, guru, staff

| Sub-Feature | Route | Description |
|-------------|-------|-------------|
| Dashboard | `/bk` | Navigation hub |
| Kasus | `/bk/kasus/*` | Counseling cases |
| Sesi | `/bk/sesi/*` | Counseling sessions |
| Hasil | `/bk/hasil/*` | Counseling outcomes |
| Tindakan | `/bk/tindakan/*` | Follow-up actions |
| Jenis | `/bk/jenis/*` | BK types |
| Kategori | `/bk/kategori/*` | BK categories |
| Lampiran | `/bk/lampiran/*` | Case attachments |
| Wali | `/bk/wali/*` | Guardian involvement |

**Service:** `src/features/bk/services/bkService.js`
**Pages:** `src/features/bk/pages/`

---

## Perpustakaan (Library)

- **Access:** admin, petugas_perpustakaan

| Sub-Feature | Route | Description |
|-------------|-------|-------------|
| Dashboard | `/perpustakaan` | Navigation hub |
| Buku | `/perpustakaan/buku/*` | Book catalog CRUD |
| Peminjaman | `/perpustakaan/peminjaman/*` | Loan management |

**Pages:** `src/features/perpustakaan/pages/`

---

## Ekstrakurikuler (Extracurricular)

- **Route:** `/ekstrakurikuler/*`
- **Access:** admin, guru

| Sub-Feature | Pages |
|-------------|-------|
| Ekstrakurikuler | List, Form, Detail |
| Siswa Ekskul | `EksSiswa*` — List, Form, Detail |

**Pages:** `src/features/ekstrakurikuler/pages/`

---

## Organisasi (Organization / Student Council)

- **Route:** `/organisasi/*`
- **Access:** admin, guru

| Sub-Feature | Pages |
|-------------|-------|
| Organisasi | List, Form, Detail |
| Anggota | List, Form, Detail |

**Pages:** `src/features/organisasi/pages/`

---

## PPDB (Student Enrollment)

- **Route:** `/ppdb/*`
- **Access:** admin only

| Sub-Feature | Route |
|-------------|-------|
| Gelombang (Batch) | `/ppdb/gelombang/*` |
| Pendaftaran (Registration) | `/ppdb/pendaftaran/*` |
| Dokumen | `/ppdb/dokumen/*` |

**Pages:** `src/features/ppdb/pages/`

---

## Sekolah (School Profile)

- **Route:** `/sekolah/*`
- **Access:** admin only
- **Pages:** `src/features/sekolah/pages/` — Detail view, Edit form

---

## Statistik (Statistics Dashboard)

- **Route:** `/statistik/*`
- **Access:** admin, guru
- **Pages:** `src/features/statistik/pages/`

Tabbed dashboard covering:
Overview, Akademik, Kehadiran, Keuangan, BK, PPDB, Perpustakaan, Ujian, Ekstrakurikuler, Organisasi, Guru, SPK

---

## SPK (Decision Support System)

- **Route:** `/spk/*`
- **Access:** admin only
- **Pages:** `src/features/spk/pages/`

| Sub-Feature | Pages |
|-------------|-------|
| Kriteria | List, Form, Detail |
| Penilaian | List, Form, Detail |
| Hasil | List, Detail |

---

## Shared Infrastructure

| Component | Path | Description |
|-----------|------|-------------|
| [`Sidebar.jsx`](src/components/layout/Sidebar.jsx) | `src/components/layout/` | Dynamic menu loaded from API, cached in sessionStorage |
| [`ProtectedRoute.jsx`](src/components/ProtectedRoute.jsx) | `src/components/` | Auth guard |
| [`RoleGuard`](src/components/guards/RoleGuard.jsx) | `src/components/guards/` | Role-based access control per route |
| [`apiService`](src/utils/api.js) | `src/utils/` | Axios wrapper |
| [`useAuthStore`](src/store/useAuthStore.js) | `src/store/` | Zustand auth state |
| SweetAlert2 | `src/utils/sweetalert.js` | `showSuccess`, `showError` helpers |