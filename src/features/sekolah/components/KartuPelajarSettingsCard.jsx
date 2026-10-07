import { useState, useEffect } from 'react'
import { IdCard, RotateCcw, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { sekolahService } from '../services/sekolahService'
import { fileUploadService } from '../../../services/fileUploadService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import KartuPelajarPreview from './KartuPelajarPreview'
import KartuPelajarCoordForm from './KartuPelajarCoordForm'

const DEFAULT_TEMPLATE = {
  card_width_mm: 85.6,
  card_height_mm: 54.0,
  bg_depan: '',
  bg_belakang: '',
  layout: {
    sekolah: { show: true, x: 6.0, y: 5.0, font_size: 7.5, color: '#1e3a8a', bold: true },
    foto: { show: true, x: 6.0, y: 13.5, width: 21.0, height: 27.0, border_radius: 2.0 },
    nama: { show: true, x: 30.0, y: 15.0, font_size: 8.5, color: '#0f172a', bold: true },
    nisn: { show: true, x: 30.0, y: 20.5, font_size: 7.0, color: '#334155', label: 'NISN: ' },
    nis: { show: true, x: 30.0, y: 24.5, font_size: 7.0, color: '#334155', label: 'NIS: ' },
    kelas: { show: true, x: 30.0, y: 28.5, font_size: 7.0, color: '#334155', label: 'Kelas: ' },
    qr: { show: true, x: 63.0, y: 28.0, size: 17.0 },
  },
}

export default function KartuPelajarSettingsCard({ sekolahId }) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewSide, setPreviewSide] = useState('front')
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)

  useEffect(() => {
    if (sekolahId) loadTemplate(sekolahId)
  }, [sekolahId])

  const loadTemplate = async (id) => {
    if (typeof sekolahService.getKartuPelajarTemplate !== 'function') return
    setLoading(true)
    const { data, error } = await sekolahService.getKartuPelajarTemplate(id)
    if (!error && data?.data) {
      setTemplate({
        ...DEFAULT_TEMPLATE,
        ...data.data,
        layout: { ...DEFAULT_TEMPLATE.layout, ...(data.data.layout || {}) },
      })
    }
    setLoading(false)
  }

  const setCoord = (key, field, val) => {
    setTemplate((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: {
          ...prev.layout[key],
          [field]: field === 'show' || field === 'bold' ? Boolean(val) : (field === 'color' || field === 'label' ? val : Number(val) || 0),
        },
      },
    }))
  }

  const handleUploadBg = async (e, side) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) return showError('Ukuran file maksimal 3 MB')

    const setUpload = side === 'front' ? setUploadingFront : setUploadingBack
    setUpload(true)
    try {
      const { data, error } = await fileUploadService.uploadFile(file, 'kartu_pelajar')
      if (error) {
        showError(typeof error === 'string' ? error : error?.message || 'Gagal mengunggah gambar')
      } else {
        const path = data?.data?.path || data?.data?.file_path || data?.data?.url
        setTemplate((p) => ({ ...p, [side === 'front' ? 'bg_depan' : 'bg_belakang']: path }))
        showSuccess(`Latar belakang sisi ${side === 'front' ? 'depan' : 'belakang'} berhasil diunggah!`)
      }
    } catch {
      showError('Gagal mengunggah gambar')
    } finally {
      setUpload(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await sekolahService.updateKartuPelajarTemplate(sekolahId, template)
    setSaving(false)
    if (error) showError(error?.message || 'Gagal menyimpan pengaturan')
    else showSuccess('Pengaturan template dan koordinat kartu pelajar berhasil disimpan!')
  }

  const scale = 320 / template.card_width_mm
  const previewHeight = template.card_height_mm * scale

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IdCard size={20} className="text-primary-600" />
              Template & Form Koordinat Kartu Pelajar (CR-80)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload desain kartu dan sesuaikan koordinat elemen (X/Y mm) untuk cetak massal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setTemplate(DEFAULT_TEMPLATE)} type="button">
              <RotateCcw size={16} className="mr-1" /> Reset Preset
            </Button>
            <Button onClick={handleSave} disabled={saving} loading={saving}>
              <Save size={16} className="mr-1" /> Simpan Pengaturan
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <KartuPelajarPreview
                template={template}
                setTemplate={setTemplate}
                previewSide={previewSide}
                setPreviewSide={setPreviewSide}
                scale={scale}
                previewHeight={previewHeight}
                uploadingFront={uploadingFront}
                uploadingBack={uploadingBack}
                onUploadBg={handleUploadBg}
              />
            </div>
            <div className="lg:col-span-7">
              <KartuPelajarCoordForm template={template} setCoord={setCoord} />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

