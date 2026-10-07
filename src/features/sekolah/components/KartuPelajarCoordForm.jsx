const TEXT_FIELDS = [
  { key: 'nama', label: 'Nama Siswa' },
  { key: 'nisn', label: 'NISN' },
  { key: 'nis', label: 'NIS' },
  { key: 'kelas', label: 'Kelas' },
]

export default function KartuPelajarCoordForm({ template, setCoord }) {
  const l = template.layout

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block pb-1 border-b dark:border-gray-700">
        Form Koordinat Elemen (mm)
      </span>

      {/* Foto Siswa */}
      <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-xs space-y-1.5">
        <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
          <span>Foto Siswa</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={l.foto.show} onChange={(e) => setCoord('foto', 'show', e.target.checked)} /> Tampilkan
          </label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div><label className="text-[10px] text-gray-500">X (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.foto.x} onChange={(e) => setCoord('foto', 'x', e.target.value)} /></div>
          <div><label className="text-[10px] text-gray-500">Y (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.foto.y} onChange={(e) => setCoord('foto', 'y', e.target.value)} /></div>
          <div><label className="text-[10px] text-gray-500">Lebar (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.foto.width} onChange={(e) => setCoord('foto', 'width', e.target.value)} /></div>
          <div><label className="text-[10px] text-gray-500">Tinggi (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.foto.height} onChange={(e) => setCoord('foto', 'height', e.target.value)} /></div>
        </div>
      </div>

      {/* Nama, NISN, NIS, Kelas */}
      {TEXT_FIELDS.map(({ key, label }) => (
        <div key={key} className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-xs space-y-1.5">
          <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
            <span>{label}</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={l[key].show} onChange={(e) => setCoord(key, 'show', e.target.checked)} /> Tampilkan
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div><label className="text-[10px] text-gray-500">X (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l[key].x} onChange={(e) => setCoord(key, 'x', e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">Y (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l[key].y} onChange={(e) => setCoord(key, 'y', e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">Font (pt)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l[key].font_size} onChange={(e) => setCoord(key, 'font_size', e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">Warna</label><input type="color" className="h-7 w-full rounded border cursor-pointer" value={l[key].color} onChange={(e) => setCoord(key, 'color', e.target.value)} /></div>
          </div>
        </div>
      ))}

      {/* QR Code */}
      <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-xs space-y-1.5">
        <div className="flex justify-between font-medium text-gray-800 dark:text-gray-200">
          <span>QR Code Profil Siswa</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={l.qr.show} onChange={(e) => setCoord('qr', 'show', e.target.checked)} /> Tampilkan
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="text-[10px] text-gray-500">X (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.qr.x} onChange={(e) => setCoord('qr', 'x', e.target.value)} /></div>
          <div><label className="text-[10px] text-gray-500">Y (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.qr.y} onChange={(e) => setCoord('qr', 'y', e.target.value)} /></div>
          <div><label className="text-[10px] text-gray-500">Ukuran (mm)</label><input type="number" step="0.5" className="input-field text-xs py-0.5" value={l.qr.size} onChange={(e) => setCoord('qr', 'size', e.target.value)} /></div>
        </div>
      </div>
    </div>
  )
}
