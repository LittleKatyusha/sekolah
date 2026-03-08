# Analisis Bottleneck — `sekolah_fe`

> Tanggal analisis: 9 Maret 2026  
> Versi: React 19, Vite 6, AG Grid 32, Zustand 5

---

## 🔴 Kritis

### 1. `getAll()` tanpa pagination di form dropdown

Beberapa form mengambil **semua record** hanya untuk mengisi dropdown, tanpa pagination server-side yang benar:

| File | Panggilan | Risiko |
|---|---|---|
| `src/features/absensi-guru/pages/AbsensiGuruForm.jsx` | `guruService.getAll({ per_page: 1000 })` | 1000 guru di memory |
| `src/features/roles/pages/RolePermissionsForm.jsx` | `roleService.getAll({ per_page: 1000 })` + `permissionService.getAll({ per_page: 1000 })` | 2000 records + DOM rendering |
| `src/features/spk/pages/PenilaianForm.jsx` | `siswaService.getAll({ per_page: 200 })` + `kriteriaService.getAll({ per_page: 200 })` | Setiap buka form |
| `src/features/nilai/pages/NilaiForm.jsx` | `siswaService.getAll({ per_page: 100 })` + `ujianService.getAll({ per_page: 100 })` | Setiap buka form |
| `src/features/tugas/pages/TugasForm.jsx` | `guruService.getAll({ per_page: 100 })` + `kelasService.getAll({ per_page: 100 })` | Setiap buka form |
| `src/features/soal/pages/SoalForm.jsx` | `mapelService.getMapel({ per_page: 100 })` + `ujianService.getAll({ per_page: 100 })` | Setiap buka form |

**Rekomendasi fix**: Ganti dropdown biasa dengan `SearchableSelect` yang menggunakan debounced async search ke API (query by keyword, bukan load semua). Contoh pattern:

```js
// Hanya fetch saat user mengetik, bukan saat mount
const loadOptions = async (inputValue) => {
  const { data } = await guruService.search({ q: inputValue, per_page: 20 })
  return data?.data?.map(g => ({ value: g.id, label: g.nama })) ?? []
}
```

---

### 2. `BK.jsx` & `Perpustakaan.jsx` — fetch semua data hanya untuk counting

```js
// src/pages/BK.jsx line 20–23 — 4 API calls tanpa per_page limit
const [kasusRes, sesiRes, jenisRes, kategoriRes] = await Promise.all([
  bkKasusService.getAll(),   // semua kasus!
  bkSesiService.getAll(),    // semua sesi!
  bkJenisService.getAll(),
  bkKategoriService.getAll(),
])
setStats({ kasus: kasusRes.data?.data?.length })  // hanya dipakai untuk .length
```

Seluruh dataset didownload hanya untuk mendapatkan jumlah record. Dengan ribuan data, ini sangat boros bandwidth dan memory.

**Rekomendasi fix**: Gunakan `meta.total` dari response paginasi dengan `per_page=1`, atau minta backend endpoint `/count`:

```js
const { data } = await bkKasusService.getAll({ per_page: 1 })
const total = data?.meta?.total ?? 0
```

---

### 3. AG Grid CSS diimpor di 5 tempat berbeda

```js
// Duplikat import di:
// - src/components/ui/InfiniteGrid.jsx
// - src/components/ui/ServerGrid.jsx
// - src/pages/DataGrid.jsx
// - src/features/kelas/pages/KelasDetail.jsx
// - src/features/ujian/pages/UjianNilai.jsx

import 'ag-grid-community/styles/ag-grid.css'          // ~50KB
import 'ag-grid-community/styles/ag-theme-alpine.css'  // ~30KB
```

Meskipun Rollup biasanya dedup CSS pada production build, ini memperlambat HMR di development dan berisiko menghasilkan stylesheet duplikat di edge cases.

**Rekomendasi fix**: Hapus semua import tersebut dari masing-masing file, pindahkan ke satu tempat global:

```js
// src/index.css atau src/main.jsx
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
```

---

## 🟠 Signifikan

### 4. `lexical` dan `pusher-js + laravel-echo` tidak masuk `manualChunks`

`src/vite.config.js` sudah mendefinisikan manual chunks yang baik, tapi melewatkan dua library besar:

- **Lexical** (~200KB total): `lexical` + 8 sub-packages `@lexical/*` — hanya dipakai di Forum, Materi, dan Soal
- **pusher-js + laravel-echo** (~150KB): dipakai setelah login, namun masuk bundle utama karena `echoService.js` diimpor langsung di `App.jsx`

**Rekomendasi fix** — tambahkan ke `manualChunks` di `vite.config.js`:

```js
if (id.includes('lexical') || id.includes('@lexical')) {
  return 'editor-vendor'
}
if (id.includes('pusher-js') || id.includes('laravel-echo')) {
  return 'realtime-vendor'
}
```

---

### 5. Sidebar fetch menu **tanpa caching** setiap mount

`src/components/layout/Sidebar.jsx` memanggil `GET /admin/menus/tree/` setiap kali user ID tersedia. Tidak ada caching — navigasi pada mobile yang memicu open/close Sidebar akan re-fetch menu berulang kali.

**Rekomendasi fix**: Cache hasil menu di Zustand store. Menu jarang berubah, cukup fetch sekali per sesi dan invalidasi saat logout:

```js
// useMenuStore.js
const useMenuStore = create((set, get) => ({
  menus: [],
  loaded: false,
  fetchMenus: async (userId) => {
    if (get().loaded) return
    const { data } = await apiService.get('/admin/menus/tree/')
    set({ menus: data?.data ?? [], loaded: true })
  },
  reset: () => set({ menus: [], loaded: false }),
}))
```

---

### 6. `useReferenceOptions` tanpa caching — duplikasi request

`src/hooks/useReferenceOptions.js` membuat request baru ke `/admin/references/category/:cat` setiap kali hook dipanggil, bahkan untuk kategori yang sama. Jika 10 form berbeda memanggil `useReferenceOptions('jenis_kelamin')`, ada 10 request identik selama satu sesi.

**Rekomendasi fix**: Cache responses in-memory keyed by category (module-level Map), atau gunakan Zustand:

```js
const referenceCache = new Map()

export function useReferenceOptions(category, fallbackOptions = []) {
  const [options, setOptions] = useState(
    referenceCache.has(category) ? referenceCache.get(category) : fallbackOptions
  )
  useEffect(() => {
    if (!category || referenceCache.has(category)) return
    referenceService.getReferencesByCategory(category).then(({ data }) => {
      const mapped = (data || []).map(item => ({ value: item.kode, label: item.nama }))
      referenceCache.set(category, mapped)
      setOptions(mapped)
    })
  }, [category])
  return { options }
}
```

---

### 7. WebSocket reconnect penuh saat token refresh

`src/App.jsx` — `WebSocketManager` mempunyai `[isAuthenticated, token]` sebagai dependencies:

```js
useEffect(() => {
  if (!isAuthenticated || !token) {
    echoService.disconnect()
    return
  }
  echoService.connect(token)
  // ...
  return () => {
    echoService.disconnect() // ← disconnect lagi saat token refresh
  }
}, [isAuthenticated, token]) // ← token berubah setiap refresh
```

Setiap kali `api.js` interceptor me-refresh token, `token` di store berubah → effect ini re-run → seluruh Echo connection dicabut dan dibuat ulang → semua subscriptions channel aktif terputus sesaat.

**Rekomendasi fix**: Pisahkan lifecycle connect (hanya `isAuthenticated`) dari token update:

```js
// Connect hanya berdasarkan auth state
useEffect(() => {
  if (!isAuthenticated) {
    echoService.disconnect()
    return
  }
  echoService.connect(token)
  return () => echoService.disconnect()
}, [isAuthenticated]) // ← hapus token dari deps

// Update token tanpa reconnect
useEffect(() => {
  if (isAuthenticated && token) {
    echoService.updateToken(token) // tambahkan method ini di echoService
  }
}, [token])
```

---

### 8. `staticParams` object literal menyebabkan AG Grid flush cache

`src/components/ui/InfiniteGrid.jsx` membungkus datasource dalam `useMemo([endpoint, transformData, staticParams])`. Jika pemanggil membuat object literal inline, object baru terbentuk setiap render:

```jsx
// ❌ Setiap render parent → object baru → datasource baru → flush cache grid
<InfiniteGrid staticParams={{ semester_id: activeSemester }} />

// ✅ Memoize di caller
const staticParams = useMemo(() => ({ semester_id: activeSemester }), [activeSemester])
<InfiniteGrid staticParams={staticParams} />
```

Ini pattern yang cukup tersebar di berbagai list page dan menyebabkan grid refetch tanpa perlu.

**Rekomendasi fix**: Dokumentasikan requirement ini di JSDoc `InfiniteGrid`, dan pertimbangkan deep-equality check (`JSON.stringify`) di dalam `useMemo` sebagai safety net.

---

## 🟡 Minor / Architectural

### 9. Dashboard admin: semua chart diimpor eagerly

`src/pages/Dashboard.jsx` mengimpor 10+ chart components secara langsung (tidak lazy), termasuk dashboard untuk role yang mungkin tidak relevan:

```js
import GuruDashboard from '../features/dashboard/components/GuruDashboard'
import SiswaDashboard from '../features/dashboard/components/SiswaDashboard'
import WaliDashboard from '../features/dashboard/components/WaliDashboard'
// ... 10+ chart components lainnya
```

Semua diparse dan dieksekusi saat admin membuka Dashboard, meskipun hanya satu role yang aktif.

**Rekomendasi fix**:

```js
const GuruDashboard  = lazy(() => import('../features/dashboard/components/GuruDashboard'))
const SiswaDashboard = lazy(() => import('../features/dashboard/components/SiswaDashboard'))
const WaliDashboard  = lazy(() => import('../features/dashboard/components/WaliDashboard'))
```

---

### 10. `stripHtml` via `innerHTML` — potensi XSS + performa

`src/features/forum/pages/ForumList.jsx`:

```js
function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html  // ← parsing HTML per item, setiap render
  return tmp.textContent || tmp.innerText || ''
}
```

**Dua masalah**:
1. **Performa**: Membuat DOM node baru per item saat merender list. Dengan infinite scroll (15 item per halaman × banyak scroll), overhead ini terakumulasi.
2. **Keamanan**: Jika `html` berisi payload seperti `<img src=x onerror="...">`, browser akan mencoba mengeksekusinya saat parsing `innerHTML`, bahkan dalam hidden element.

**Rekomendasi fix** — gunakan regex atau `DOMParser` dengan sanitasi:

```js
// Aman dan lebih cepat untuk stripping basic HTML
function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}
```

---

### 11. `window.location.href = '/login'` di interceptor — hard page reload

`src/utils/api.js` saat token refresh gagal:

```js
window.location.href = '/login'  // full page reload, buang semua React + Zustand state
```

Ini membuang seluruh in-memory state React, menyebabkan kilatan blank screen, dan tidak bisa ditest dengan unit test.

**Rekomendasi fix**: Gunakan custom event atau callback yang dihandle oleh router:

```js
// Di api.js — emit event, jangan hardcode navigasi
window.dispatchEvent(new CustomEvent('auth:logout-required'))

// Di App.jsx — handle event
useEffect(() => {
  const handler = () => navigate('/login', { replace: true })
  window.addEventListener('auth:logout-required', handler)
  return () => window.removeEventListener('auth:logout-required', handler)
}, [navigate])
```

---

### 12. `RoleGuard` array lookup `includes()` pada setiap render

`src/components/guards/RoleGuard.jsx` melakukan `allowedRoles.includes(user?.role)` menggunakan array search O(n) setiap render, dengan 80+ route yang masing-masing membuat `allowedRoles` baru sebagai array literal.

**Rekomendasi fix** — gunakan `Set` untuk O(1) lookup:

```js
const RoleGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore()
  const allowedSet = useMemo(() => new Set(allowedRoles), [allowedRoles])

  if (!isAuthenticated) return <Navigate to="/login" ... />
  if (!allowedSet.has(user?.role)) return <Navigate to="/unauthorized" replace />
  return children
}
```

---

### 13. Tidak ada global data-fetching cache (React Query / SWR)

Seluruh data fetching dilakukan manual via `useState + useEffect`. Navigasi bolak-balik antar halaman selalu trigger fresh fetch tanpa deduplikasi. Tidak ada:
- Deduplikasi request identik yang terjadi bersamaan
- Background refetch saat tab kembali aktif
- Stale-while-revalidate pattern
- Optimistic updates untuk mutasi

Ini menjadi investment refactor terbesar namun dengan dampak tertinggi jangka panjang.

**Rekomendasi**: Migrasi bertahap ke **TanStack Query (React Query v5)** yang sudah kompatibel dengan React 19.

---

## Ringkasan Prioritas

| # | Bottleneck | Impact | Effort | File Utama |
|---|---|---|---|---|
| 2 | `getAll()` tanpa limit untuk stats | 🔴 Tinggi | 🟢 Rendah | `BK.jsx`, `Perpustakaan.jsx` |
| 1 | `per_page: 1000` di form dropdown | 🔴 Tinggi | 🟡 Sedang | `AbsensiGuruForm`, `RolePermissionsForm`, dll |
| 3 | AG Grid CSS duplikat | 🟡 Sedang | 🟢 Rendah | 5 file |
| 4 | Lexical/Pusher tidak dichunk | 🟡 Sedang | 🟢 Rendah | `vite.config.js` |
| 5 | Sidebar menu tidak dicache | 🟡 Sedang | 🟡 Sedang | `Sidebar.jsx` |
| 6 | `useReferenceOptions` tidak dicache | 🟡 Sedang | 🟡 Sedang | `useReferenceOptions.js` |
| 7 | WS reconnect saat token refresh | 🟡 Sedang | 🟡 Sedang | `App.jsx`, `echoService.js` |
| 8 | `staticParams` object literal di InfiniteGrid | 🟡 Sedang | 🟢 Rendah | semua list pages |
| 9 | Dashboard chart eager loading | 🟡 Sedang | 🟢 Rendah | `Dashboard.jsx` |
| 10 | `stripHtml` via DOM per row | 🟡 Sedang | 🟢 Rendah | `ForumList.jsx` |
| 11 | `window.location.href` hard reload | 🟡 Sedang | 🟢 Rendah | `api.js` |
| 12 | `RoleGuard` array includes O(n) | 🟢 Rendah | 🟢 Rendah | `RoleGuard.jsx` |
| 13 | Tidak ada global caching layer (React Query) | 🔴 Tinggi | 🔴 Tinggi | Seluruh codebase |
