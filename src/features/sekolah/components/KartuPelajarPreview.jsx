import { Eye, Upload, Trash2 } from 'lucide-react'

export default function KartuPelajarPreview({
  template,
  setTemplate,
  previewSide,
  setPreviewSide,
  scale,
  previewHeight,
  uploadingFront,
  uploadingBack,
  onUploadBg,
}) {
  const l = template.layout

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Eye size={14} /> Pratinjau Desain (CR-80)
        </span>
        <div className="flex rounded border border-gray-200 dark:border-gray-700 text-xs">
          <button
            type="button"
            onClick={() => setPreviewSide('front')}
            className={`px-2.5 py-1 ${previewSide === 'front' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Depan
          </button>
          <button
            type="button"
            onClick={() => setPreviewSide('back')}
            className={`px-2.5 py-1 ${previewSide === 'back' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Belakang
          </button>
        </div>
      </div>

      <div className="flex justify-center p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <div style={{ width: '320px', height: `${previewHeight}px`, position: 'relative', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {previewSide === 'front' ? (
            <>
              {template.bg_depan ? <img src={template.bg_depan} alt="BG" className="absolute inset-0 w-full h-full object-cover z-0" /> : <div className="absolute top-0 left-0 right-0 h-9 bg-blue-900 z-0" />}
              {l.sekolah?.show && <div style={{ position: 'absolute', left: `${l.sekolah.x * scale}px`, top: `${l.sekolah.y * scale}px`, fontSize: `${l.sekolah.font_size}px`, color: template.bg_depan ? l.sekolah.color : '#fff', fontWeight: 'bold', zIndex: 2 }}>SMK NEGERI 1</div>}
              {l.foto?.show && <div style={{ position: 'absolute', left: `${l.foto.x * scale}px`, top: `${l.foto.y * scale}px`, width: `${l.foto.width * scale}px`, height: `${l.foto.height * scale}px`, border: '1px solid #94a3b8', backgroundColor: '#e2e8f0', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>FOTO</div>}
              {l.nama?.show && <div style={{ position: 'absolute', left: `${l.nama.x * scale}px`, top: `${l.nama.y * scale}px`, fontSize: `${l.nama.font_size}px`, color: l.nama.color, fontWeight: 'bold', zIndex: 2, whiteSpace: 'nowrap' }}>MUHAMAD FAISAL</div>}
              {l.nisn?.show && <div style={{ position: 'absolute', left: `${l.nisn.x * scale}px`, top: `${l.nisn.y * scale}px`, fontSize: `${l.nisn.font_size}px`, color: l.nisn.color, zIndex: 2 }}>NISN: 0051234567</div>}
              {l.nis?.show && <div style={{ position: 'absolute', left: `${l.nis.x * scale}px`, top: `${l.nis.y * scale}px`, fontSize: `${l.nis.font_size}px`, color: l.nis.color, zIndex: 2 }}>NIS: 2026001</div>}
              {l.kelas?.show && <div style={{ position: 'absolute', left: `${l.kelas.x * scale}px`, top: `${l.kelas.y * scale}px`, fontSize: `${l.kelas.font_size}px`, color: l.kelas.color, zIndex: 2 }}>Kelas: X RPL 1</div>}
              {l.qr?.show && <div style={{ position: 'absolute', left: `${l.qr.x * scale}px`, top: `${l.qr.y * scale}px`, width: `${l.qr.size * scale}px`, height: `${l.qr.size * scale}px`, backgroundColor: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontSize: '9px', fontWeight: 'bold', color: '#1e3a8a' }}>[QR]</div>}
            </>
          ) : (
            template.bg_belakang ? <img src={template.bg_belakang} alt="BG Belakang" className="absolute inset-0 w-full h-full object-cover z-0" /> : <div className="p-3 text-center text-xs"><p className="font-bold text-blue-900 mb-1">TATA TERTIB</p><p className="text-[9px] text-gray-600">Kartu tanda pengenal resmi siswa.</p></div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs space-y-2">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Upload Desain Latar Belakang (PNG/JPG)</span>
        <div className="flex gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <Upload size={14} /> {uploadingFront ? '...' : 'Latar Depan'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadBg(e, 'front')} disabled={uploadingFront} />
          </label>
          {template.bg_depan && <button type="button" onClick={() => setTemplate((p) => ({ ...p, bg_depan: '' }))} className="text-red-600 p-1"><Trash2 size={14} /></button>}
          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <Upload size={14} /> {uploadingBack ? '...' : 'Latar Belakang'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadBg(e, 'back')} disabled={uploadingBack} />
          </label>
          {template.bg_belakang && <button type="button" onClick={() => setTemplate((p) => ({ ...p, bg_belakang: '' }))} className="text-red-600 p-1"><Trash2 size={14} /></button>}
        </div>
      </div>
    </div>
  )
}
