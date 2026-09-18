import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Send, Upload, RefreshCw, AlertCircle, X } from 'lucide-react'
import { blogService } from '../services/blogService'
import { fileUploadService } from '../../../services/fileUploadService'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import { showToast } from '../../../utils/sweetalert'

export const ArtikelFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form State
  const [judul, setJudul] = useState('')
  const [kategoriId, setKategoriId] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [ringkasan, setRingkasan] = useState('')
  const [konten, setKonten] = useState('')
  const [errors, setErrors] = useState({})

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await blogService.getCategories({ is_active: 1 })
        if (data?.data) {
          setCategories(data.data)
        }
      } catch {
        // Ignored
      }
    }
    fetchCats()
  }, [])

  // Fetch article if editing
  useEffect(() => {
    if (!id) return

    const fetchDetail = async () => {
      setLoading(true)
      try {
        const { data, error } = await blogService.getById(id)
        if (error) {
          showToast(typeof error === 'string' ? error : (error.message || 'Gagal mengambil data artikel'), 'error')
          navigate('/artikel')
          return
        }
        const item = data?.data || data
        setJudul(item.judul || '')
        setKategoriId(item.trx_artikel_kategori_id || '')
        setThumbnailUrl(item.thumbnail_url || '')
        setRingkasan(item.ringkasan || '')
        setKonten(item.konten || '')
      } catch {
        showToast('Terjadi kesalahan saat memuat artikel', 'error')
        navigate('/artikel')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id, navigate])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const { data, error } = await fileUploadService.uploadFile(file, 'artikel')
      if (error) {
        showToast(typeof error === 'string' ? error : (error.message || 'Gagal mengunggah thumbnail'), 'error')
      } else {
        const fileUrl = data?.data?.url || data?.url || data?.file_path || data?.path
        setThumbnailUrl(fileUrl)
        showToast('Thumbnail berhasil diunggah', 'success')
      }
    } catch {
      showToast('Gagal mengunggah file', 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const validate = () => {
    const errs = {}
    if (!judul.trim()) errs.judul = 'Judul artikel wajib diisi'
    if (judul.trim().length > 255) errs.judul = 'Judul maksimal 255 karakter'
    if (!konten || !konten.trim() || konten.trim() === '<p></p>') {
      errs.konten = 'Konten artikel tidak boleh kosong'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (actionType) => {
    if (!validate()) {
      showToast('Mohon lengkapi kolom yang wajib diisi', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        judul: judul.trim(),
        trx_artikel_kategori_id: kategoriId ? Number(kategoriId) : null,
        thumbnail_url: thumbnailUrl || null,
        ringkasan: ringkasan.trim() || null,
        konten: konten.trim(),
        action: actionType, // 'draft' or 'submit'
      }

      let res
      if (isEdit) {
        res = await blogService.update(id, payload)
      } else {
        res = await blogService.create(payload)
      }

      if (res.error) {
        if (res.error.errors) {
          setErrors(res.error.errors)
        }
        showToast(typeof res.error === 'string' ? res.error : (res.error.message || 'Gagal menyimpan artikel'), 'error')
      } else {
        showToast(
          actionType === 'submit'
            ? 'Artikel berhasil diajukan untuk review!'
            : 'Draf artikel berhasil disimpan!',
          'success'
        )
        navigate('/artikel')
      }
    } catch {
      showToast('Terjadi kesalahan saat memproses data', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mr-2" />
        <span>Memuat data artikel...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/artikel"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h1>
            <p className="text-xs text-gray-500">
              Buat dan publikasikan berita sekolah atau karya tulis siswa & guru.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('submit')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Ajukan Review</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="judul" className="block text-sm font-medium text-gray-700">
            Judul Artikel <span className="text-rose-500">*</span>
          </label>
          <input
            id="judul"
            type="text"
            required
            maxLength={255}
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Masukkan judul artikel yang menarik..."
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              errors.judul ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-600'
            }`}
          />
          {errors.judul && <p className="text-xs text-rose-600">{errors.judul}</p>}
        </div>

        {/* Category & Thumbnail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="space-y-1">
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              id="kategori"
              value={kategoriId}
              onChange={(e) => setKategoriId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600 bg-white"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Thumbnail / Cover</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="thumbnail-upload"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {uploadingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Pilih Gambar</span>
              </label>

              {thumbnailUrl && (
                <div className="relative inline-block">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-12 h-10 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">Rekomendasi ukuran 1200x630 piksel (JPG/PNG/WEBP)</p>
          </div>
        </div>

        {/* Ringkasan (Excerpt) */}
        <div className="space-y-1">
          <label htmlFor="ringkasan" className="block text-sm font-medium text-gray-700">
            Ringkasan (Opsional)
          </label>
          <textarea
            id="ringkasan"
            rows={2}
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            placeholder="Biarkan kosong untuk ringkasan otomatis dari isi artikel..."
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
          />
        </div>

        {/* Konten Editor (Lexical) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Konten Artikel <span className="text-rose-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <LexicalEditor
              value={konten}
              onChange={(html) => setKonten(html)}
              placeholder="Mulai tulis artikel lengkap di sini..."
              minHeight="350px"
            />
          </div>
          {errors.konten && <p className="text-xs text-rose-600">{errors.konten}</p>}
        </div>
      </div>
    </div>
  )
}

export default ArtikelFormPage
