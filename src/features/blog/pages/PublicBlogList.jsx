import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, ArrowLeft, RefreshCw, BookOpen } from 'lucide-react'
import { blogService } from '../services/blogService'
import { BlogCard } from '../components/BlogCard'
import { getSubdomain } from '../../sekolah/pages/PublicProfile'
import { sekolahService } from '../../sekolah/services/sekolahService'
import useAuthStore from '../../../store/useAuthStore'

const getPageNumbers = (current, last) => {
  if (!last || last <= 1) return []
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', last]
  if (current >= last - 3) return [1, '...', last - 4, last - 3, last - 2, last - 1, last]
  return [1, '...', current - 1, current, current + 1, '...', last]
}

export const PublicBlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [schoolInfo, setSchoolInfo] = useState(null)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Resolve tenant strictly from URL search params, subdomain, or active user tenant
  const resolveSchoolId = () => {
    const fromParam = searchParams.get('sekolah') || searchParams.get('tenant') || searchParams.get('subdomain') || searchParams.get('identifier')
    if (fromParam) return fromParam.toLowerCase().trim()

    const sub = getSubdomain()
    if (sub && sub !== 'app' && sub !== 'www') return sub

    const user = useAuthStore.getState().user
    if (user?.tenant?.slug) return user.tenant.slug
    if (user?.tenant?.id) return String(user.tenant.id)
    if (user?.mst_sekolah_id) return String(user.mst_sekolah_id)

    return 'akademihub'
  }

  const schoolId = resolveSchoolId()
  const selectedCategory = searchParams.get('kategori') || ''
  const searchQuery = searchParams.get('search') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Fetch school profile for branding
  useEffect(() => {
    if (!schoolId || schoolId === 'akademihub') {
      setSchoolInfo(null)
      return
    }
    let isMounted = true
    sekolahService.getPublicProfile(schoolId).then(({ data }) => {
      if (isMounted && data) {
        setSchoolInfo(data)
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [schoolId])

  const fetchCategories = useCallback(async () => {
    if (!schoolId) return
    const { data } = await blogService.getPublicCategories({ sekolah: schoolId })
    if (data?.data) setCategories(data.data)
  }, [schoolId])

  const fetchArticles = useCallback(async () => {
    if (!schoolId) {
      setError('Parameter sekolah tidak ditemukan.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = { sekolah: schoolId, page: currentPage, limit: 9 }
      if (selectedCategory) params.kategori = selectedCategory
      if (searchQuery) params.search = searchQuery
      const { data, error: apiErr } = await blogService.getPublicArticles(params)
      if (apiErr) throw new Error(typeof apiErr === 'string' ? apiErr : (apiErr.message || 'Gagal'))
      setArticles(data?.data || [])
      setMeta(data?.meta || { current_page: 1, last_page: 1, total: 0 })
    } catch (err) {
      setError(err.message || 'Gagal memuat artikel')
    } finally {
      setLoading(false)
    }
  }, [schoolId, selectedCategory, searchQuery, currentPage])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { fetchArticles() }, [fetchArticles])

  const handleSearch = (e) => {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    searchInput.trim() ? p.set('search', searchInput.trim()) : p.delete('search')
    p.set('page', '1')
    setSearchParams(p)
  }

  const handleCategory = (slug) => {
    const p = new URLSearchParams(searchParams)
    slug ? p.set('kategori', slug) : p.delete('kategori')
    p.set('page', '1')
    setSearchParams(p)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > meta.last_page || newPage === currentPage) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(newPage))
    setSearchParams(p)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const schoolQuery = schoolId && schoolId !== 'akademihub' ? `sekolah=${encodeURIComponent(schoolId)}` : ''
  const displayName = schoolInfo?.nama || schoolInfo?.nama_sekolah || (schoolId !== 'akademihub' ? schoolId.toUpperCase() : '')

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#14231f] flex flex-col font-sans">
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#eaece8] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to={schoolQuery ? `/profile?${schoolQuery}` : '/'}
            className="inline-flex items-center gap-2 text-sm text-[#52605b] hover:text-[#245a49] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{displayName ? `Profil ${displayName}` : 'Beranda'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#245a49]" />
            <span className="font-bold text-[#14231f] text-sm sm:text-base">
              {displayName ? `Kabar & Artikel · ${displayName}` : 'Kabar & Artikel'}
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-left w-full">
        <p className="text-xs uppercase tracking-widest font-semibold text-[#245a49] mb-2">
          {displayName ? `Wawasan & Panduan · ${displayName}` : 'Wawasan & Panduan'}
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#14231f] leading-tight mb-3">
          Kabar &amp; Artikel<br />
          <em className="font-serif italic text-[#245a49] font-normal">
            {displayName ? `${displayName}.` : 'Pendidikan Sekolah.'}
          </em>
        </h1>
        <p className="text-base sm:text-lg text-[#52605b] max-w-2xl leading-relaxed">
          {displayName
            ? `Publikasi prestasi, liputan kegiatan, dan kabar terkini dari civitas akademika ${displayName}.`
            : 'Praktik tata usaha digital, manajemen sekolah, dan teknologi edukasi terkini.'}
        </p>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex-1 w-full space-y-8">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52605b]" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari artikel..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#d8dcd5] text-[#14231f] text-sm focus:outline-none focus:border-[#245a49] focus:ring-1 focus:ring-[#245a49] shadow-sm transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#245a49] hover:bg-[#1a3e33] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Cari
            </button>
          </form>

          {categories.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCategory('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !selectedCategory
                    ? 'bg-[#245a49] text-white border border-[#245a49] shadow-sm'
                    : 'bg-white text-[#52605b] border border-[#d8dcd5] hover:border-[#245a49] hover:text-[#14231f]'
                }`}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategory(c.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === c.slug
                      ? 'bg-[#245a49] text-white border border-[#245a49] shadow-sm'
                      : 'bg-white text-[#52605b] border border-[#d8dcd5] hover:border-[#245a49] hover:text-[#14231f]'
                  }`}
                >
                  {c.nama}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#52605b]">
            <RefreshCw className="w-8 h-8 animate-spin text-[#245a49] mb-3" />
            <p className="text-sm">Memuat artikel...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-white border border-[#eaece8] rounded-xl text-center space-y-3 shadow-sm">
            <p className="text-rose-600 font-medium text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchArticles}
              className="px-4 py-2 bg-[#245a49] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3e33] transition"
            >
              Coba lagi
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#eaece8] rounded-xl p-8 space-y-2 shadow-sm">
            <h3 className="text-lg font-bold text-[#14231f]">Belum ada artikel</h3>
            <p className="text-[#52605b] text-sm">Cobalah kata kunci lain atau pilih kategori yang berbeda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((item) => (
              <BlogCard key={item.id} artikel={item} schoolQuery={schoolQuery} />
            ))}
          </div>
        )}

        {/* Pagination Matching https://akademihub.id/blog/ */}
        {meta.last_page > 1 && (
          <div className="pt-8 border-t border-[#eaece8] flex flex-col items-center gap-3">
            <nav className="inline-flex items-center gap-1.5 flex-wrap justify-center" aria-label="Navigasi halaman">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3.5 py-1.5 rounded-lg border border-[#d8dcd5] bg-white text-xs font-semibold text-[#14231f] hover:border-[#245a49] hover:bg-[#fbfaf6] disabled:opacity-40 disabled:pointer-events-none transition"
              >
                ← Sebelumnya
              </button>

              {getPageNumbers(currentPage, meta.last_page).map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-[#52605b]">
                      …
                    </span>
                  )
                }
                const isCurrent = item === currentPage
                return (
                  <button
                    key={`page-${item}`}
                    type="button"
                    onClick={() => handlePageChange(item)}
                    className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-semibold transition ${
                      isCurrent
                        ? 'bg-[#245a49] text-white shadow-sm'
                        : 'bg-white border border-[#d8dcd5] text-[#14231f] hover:border-[#245a49]'
                    }`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={currentPage >= meta.last_page}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3.5 py-1.5 rounded-lg border border-[#d8dcd5] bg-white text-xs font-semibold text-[#14231f] hover:border-[#245a49] hover:bg-[#fbfaf6] disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Selanjutnya →
              </button>
            </nav>
            <div className="text-xs text-[#52605b]">
              Menampilkan halaman {meta.current_page} dari {meta.last_page} ({meta.total} artikel)
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#eaece8] py-8 text-center text-xs text-[#52605b]">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 {displayName ? `${displayName} · ` : ''}AkademiHub. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicBlogList
