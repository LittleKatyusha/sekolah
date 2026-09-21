import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Calendar, Eye, User, ArrowLeft, RefreshCw, AlertCircle, Share2, Tag } from 'lucide-react'
import { blogService } from '../services/blogService'
import { SafeArticleContent } from '../components/SafeArticleContent'
import { getSubdomain } from '../../sekolah/pages/PublicProfile'

export const PublicBlogDetail = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [artikel, setArtikel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const schoolId =
    searchParams.get('sekolah') ||
    searchParams.get('tenant') ||
    searchParams.get('subdomain') ||
    searchParams.get('identifier') ||
    getSubdomain()

  useEffect(() => {
    if (!slug) return

    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = schoolId ? { sekolah: schoolId } : {}
        const { data, error: apiErr } = await blogService.getPublicArticleBySlug(slug, params)
        if (apiErr) {
          throw new Error(typeof apiErr === 'string' ? apiErr : (apiErr.message || 'Artikel tidak ditemukan'))
        }
        setArtikel(data?.data || null)
      } catch (err) {
        setError(err.message || 'Gagal memuat artikel')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [slug, schoolId])

  // Inject SEO Meta tags & JSON-LD
  useEffect(() => {
    if (!artikel) return

    const prevTitle = document.title
    document.title = `${artikel.judul} — Artikel Sekolah`

    // Helper for meta tags
    const setMeta = (attr, key, content) => {
      if (!content) return
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', artikel.ringkasan || '')
    setMeta('property', 'og:title', artikel.judul)
    setMeta('property', 'og:description', artikel.ringkasan || '')
    setMeta('property', 'og:type', 'article')
    setMeta('property', 'og:url', window.location.href)
    setMeta('property', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('property', 'twitter:title', artikel.judul)
    setMeta('name', 'twitter:title', artikel.judul)
    setMeta('property', 'twitter:description', artikel.ringkasan || '')
    setMeta('name', 'twitter:description', artikel.ringkasan || '')
    if (artikel.thumbnail_url) {
      const imageType = artikel.thumbnail_url.endsWith('.png') ? 'image/png' : artikel.thumbnail_url.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
      setMeta('property', 'og:image', artikel.thumbnail_url)
      setMeta('property', 'og:image:secure_url', artikel.thumbnail_url)
      setMeta('property', 'og:image:type', imageType)
      setMeta('property', 'og:image:width', '1200')
      setMeta('property', 'og:image:height', '630')
      setMeta('name', 'twitter:image', artikel.thumbnail_url)
      setMeta('property', 'twitter:image', artikel.thumbnail_url)
    }
    if (artikel.published_at) {
      setMeta('property', 'article:published_time', artikel.published_at)
    }
    if (artikel.author_name) {
      setMeta('property', 'article:author', artikel.author_name)
    }

    // JSON-LD
    const jsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: artikel.judul,
      description: artikel.ringkasan || '',
      image: artikel.thumbnail_url || undefined,
      author: {
        '@type': 'Person',
        name: artikel.author_name || 'Redaksi',
      },
      datePublished: artikel.published_at,
      dateModified: artikel.updated_at || artikel.published_at,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'blog-posting-jsonld'
    script.text = JSON.stringify(jsonLdData)
    document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      const existingScript = document.getElementById('blog-posting-jsonld')
      if (existingScript) existingScript.remove()
    }
  }, [artikel])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artikel?.judul,
          text: artikel?.ringkasan,
          url: window.location.href,
        })
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const waShareUrl = artikel && typeof window !== 'undefined'
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(`${artikel.judul}\n\n${window.location.href}`)}`
    : ''

  const schoolQuery = schoolId ? `sekolah=${encodeURIComponent(schoolId)}` : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !artikel) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Artikel Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600">{error || 'Artikel yang Anda cari tidak tersedia atau belum terbit.'}</p>
          <Link
            to={`/blog${schoolQuery ? `?${schoolQuery}` : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Berita</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={`/blog${schoolQuery ? `?${schoolQuery}` : ''}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Semua Artikel</span>
          </Link>
          <div className="flex items-center gap-2">
            {waShareUrl && (
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] transition"
              >
                <span>WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full space-y-8">
        {/* Header Meta */}
        <div className="space-y-4">
          {artikel.kategori && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
              <Tag className="w-3 h-3" />
              <span>{artikel.kategori.nama}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            {artikel.judul}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b pb-4">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {artikel.author_name || 'Redaksi'}
            </span>
            {artikel.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(artikel.published_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {artikel.view_count || 0} dibaca
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {artikel.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
            <img
              src={artikel.thumbnail_url}
              alt={artikel.judul}
              className="w-full h-auto max-h-[450px] object-cover"
            />
          </div>
        )}

        {/* Body Content */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <SafeArticleContent content={artikel.konten} className="text-slate-800 leading-relaxed text-base" />

          {/* Share Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bagikan Artikel Ini:</span>
            <div className="flex items-center gap-2">
              {waShareUrl && (
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba5a] transition"
                >
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Tersalin!' : 'Bagikan / Salin'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PublicBlogDetail
