import { useState } from 'react'
import QRCode from 'qrcode'
import { Download, ExternalLink, QrCode } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { apiService } from '../../../utils/api'

export default function SiswaQrCard({ siswaId }) {
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: apiError } = await apiService.get(`/siswa/${siswaId}/qr`)
      if (apiError || !data?.data?.path) throw new Error('QR tidak tersedia')
      const url = new URL(data.data.path, window.location.origin).href
      const options = { errorCorrectionLevel: 'M', margin: 4, width: 1024 }
      const [png, svg] = await Promise.all([
        QRCode.toDataURL(url, options),
        QRCode.toString(url, { ...options, type: 'svg' }),
      ])
      setQr({ url, png, svg: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
    } catch {
      setError('Gagal menyiapkan QR siswa. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <QrCode size={20} /> QR Kartu Pelajar
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Scan membuka profil publik: nama, sekolah, kelas, tahun ajaran, status. Tanpa NIS/NISN, kontak, alamat, atau data sensitif lainnya.
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {!qr ? (
        <Button className="mt-4" onClick={generate} loading={loading}>Tampilkan QR Siswa</Button>
      ) : (
        <>
          <img src={qr.png} alt="QR profil publik siswa untuk kartu pelajar" width={240} height={240} className="mx-auto my-4 max-w-full" />
          <div className="flex flex-wrap justify-center gap-3">
            <a href={qr.png} download={`qr-siswa-${siswaId}.png`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-primary-600">
              <Download size={16} /> Unduh PNG
            </a>
            <a href={qr.svg} download={`qr-siswa-${siswaId}.svg`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-primary-600">
              <Download size={16} /> Unduh SVG
            </a>
            <a href={qr.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-primary-600">
              <ExternalLink size={16} /> Lihat Profil Publik
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            PNG 1024 px; SVG tetap tajam saat dicetak. Pertahankan tepi putih, cetak minimal 3 × 3 cm, lalu uji scan sebelum produksi kartu.
          </p>
        </>
      )}
    </Card>
  )
}