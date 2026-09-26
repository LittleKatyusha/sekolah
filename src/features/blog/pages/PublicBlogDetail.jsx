import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Calendar, Eye, User, ArrowLeft, RefreshCw, AlertCircle, Share2, Check, Link as LinkIcon, BookOpen } from 'lucide-react'
import { blogService } from '../services/blogService'
import { SafeArticleContent } from '../components/SafeArticleContent'
import { getSubdomain } from '../../sekolah/pages/PublicProfile'
import useAuthStore from '../../../store/useAuthStore'

export const PublicBlogDetail = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [artikel, setArtikel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = artikel?.judul || 'Artikel Sekolah'

  const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`
  const xLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
  const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const liLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      } catch {}
    }
  }

  const schoolQuery = schoolId && schoolId !== 'akademihub' ? `sekolah=${encodeURIComponent(schoolId)}` : ''

  const formattedDate = artikel?.published_at
    ? new Date(artikel.published_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf6] flex flex-col items-center justify-center text-[#52605b]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#245a49] mb-3" />
        <p className="text-sm">Memuat artikel...</p>
      </div>
    )
  }

  if (error || !artikel) {
    return (
      <div className="min-h-screen bg-[#fbfaf6] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-[#eaece8] text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-[#14231f]">Artikel Tidak Ditemukan</h2>
          <p className="text-sm text-[#52605b]">{error || 'Artikel yang Anda cari tidak tersedia atau belum terbit.'}</p>
          <Link
            to={`/blog${schoolQuery ? `?${schoolQuery}` : ''}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#245a49] text-white rounded-lg text-sm font-semibold hover:bg-[#1a3e33] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Blog</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#14231f] flex flex-col font-sans">
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#eaece8] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={`/blog${schoolQuery ? `?${schoolQuery}` : ''}`}
            className="inline-flex items-center gap-2 text-sm text-[#52605b] hover:text-[#245a49] font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Kembali ke Blog</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#245a49]" />
            <span className="font-semibold text-xs text-[#14231f] uppercase tracking-wider">Kabar &amp; Panduan</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        {/* Header Meta & Title */}
        <header className="space-y-4">
          <div className="flex items-center flex-wrap gap-2.5 text-xs text-[#52605b]">
            {artikel.kategori && (
              <span className="bg-[#eef5f2] text-[#245a49] font-semibold px-3 py-1 rounded text-xs">
                {artikel.kategori.nama}
              </span>
            )}
            {formattedDate && <time dateTime={artikel.published_at}>{formattedDate}</time>}
            <span>· {artikel.view_count || 0} pembaca</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231f] leading-tight tracking-tight">
            {artikel.judul}
          </h1>

          {artikel.ringkasan && (
            <p className="text-lg text-[#52605b] leading-relaxed font-normal">
              {artikel.ringkasan}
            </p>
          )}

          <div className="text-sm text-[#52605b] pt-1">
            Ditulis oleh <strong className="text-[#14231f] font-semibold">{artikel.author_name || 'Tim Redaksi'}</strong>
          </div>

          {/* Social Share Bar */}
          <div className="flex items-center flex-wrap gap-2 pt-2 border-y border-[#eaece8] py-3 text-xs">
            <span className="font-medium text-[#52605b] mr-1">Bagikan:</span>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-semibold hover:bg-[#20ba5a] transition"
              title="Bagikan ke WhatsApp"
            >
              <span>WhatsApp</span>
            </a>
            <a
              href={xLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d8dcd5] bg-white text-[#14231f] font-semibold hover:border-[#14231f] transition"
              title="Bagikan ke X / Twitter"
            >
              <span>X</span>
            </a>
            <a
              href={fbLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] text-white font-semibold hover:bg-[#166fe5] transition"
              title="Bagikan ke Facebook"
            >
              <span>Facebook</span>
            </a>
            <a
              href={liLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white font-semibold hover:bg-[#095196] transition"
              title="Bagikan ke LinkedIn"
            >
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                copied
                  ? 'bg-[#eef5f2] border-[#245a49] text-[#245a49]'
                  : 'bg-white border-[#d8dcd5] text-[#14231f] hover:border-[#245a49]'
              }`}
              title="Salin tautan artikel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#245a49]" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin tautan'}</span>
            </button>
          </div>
        </header>

        {/* Thumbnail Image */}
        {artikel.thumbnail_url && (
          <div className="rounded-xl overflow-hidden bg-[#eaece8] border border-[#eaece8]">
            <img
              src={artikel.thumbnail_url}
              alt={artikel.judul}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="bg-white p-6 sm:p-10 rounded-xl border border-[#eaece8] shadow-sm space-y-6">
          <SafeArticleContent content={artikel.konten} className="text-[#14231f] leading-relaxed text-base prose prose-slate max-w-none" />
        </article>

        {/* CTA Box (matching https://akademihub.id/blog/) */}
        <section className="bg-white border border-[#eaece8] p-8 rounded-xl text-center space-y-3 shadow-sm">
          <h3 className="text-xl font-bold text-[#14231f]">Kelola Urusan Sekolah Lebih Praktis Bersama AkademiHub</h3>
          <p className="text-[#52605b] text-sm max-w-lg mx-auto">
            Tinggalkan pencatatan manual dan sistem yang terpisah. Kunjungi profil resmi sekolah untuk informasi dan layanan digital terintegrasi.
          </p>
          <div className="pt-2">
            <Link
              to={schoolQuery ? `/profile?${schoolQuery}` : '/'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#245a49] hover:bg-[#1a3e33] text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <span>Kunjungi Profil Sekolah</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#eaece8] py-8 text-center text-xs text-[#52605b]">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 AkademiHub. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicBlogDetail
