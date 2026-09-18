import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Newspaper, ArrowLeft, RefreshCw } from 'lucide-react'
import { blogService } from '../services/blogService'
import { BlogCard } from '../components/BlogCard'
import { getSubdomain } from '../../sekolah/pages/PublicProfile'

export const PublicBlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const schoolId = searchParams.get('sekolah') || searchParams.get('tenant') || searchParams.get('subdomain') || searchParams.get('identifier') || getSubdomain()
  const selectedCategory = searchParams.get('kategori') || ''
  const searchQuery = searchParams.get('search') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const [searchInput, setSearchInput] = useState(searchQuery)

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

  const schoolQuery = schoolId ? `sekolah=${encodeURIComponent(schoolId)}` : ''

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={`/profile${schoolQuery ? `?${schoolQuery}` : ''}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Profil Sekolah</span>
          </Link>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-600" />
            <span className="font-bold">Artikel & Berita</span>
          </div>
        </div>
      </header>

      <div className="bg-indigo-900 text-white py-12 px-4 text-center space-y-3">
        <h1 className="text-3xl font-extrabold">Kabar & Artikel Sekolah</h1>
        <p className="text-indigo-200 text-sm max-w-lg mx-auto">Publikasi dan prestasi karya siswa dan guru.</p>
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari artikel..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white text-slate-900 text-sm focus:outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg text-sm">Cari</button>
        </form>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => handleCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategory(c.slug)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${selectedCategory === c.slug ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
              >
                {c.nama}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center text-rose-800 text-sm">{error}</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">Belum ada artikel yang diterbitkan.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((item) => (
              <BlogCard key={item.id} artikel={item} schoolQuery={schoolQuery} />
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="flex justify-center items-center gap-3 pt-6 text-sm">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => {
                const p = new URLSearchParams(searchParams)
                p.set('page', String(meta.current_page - 1))
                setSearchParams(p)
              }}
              className="px-3 py-1.5 border rounded bg-white disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span>Halaman {meta.current_page} / {meta.last_page}</span>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => {
                const p = new URLSearchParams(searchParams)
                p.set('page', String(meta.current_page + 1))
                setSearchParams(p)
              }}
              className="px-3 py-1.5 border rounded bg-white disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default PublicBlogList
