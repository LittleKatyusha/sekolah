import * as XLSX from 'xlsx'

export const downloadNilaiTemplate = (students = [], examName = '', className = '') => {
  const headers = ['nis', 'nama_siswa', 'nilai', 'keterangan']
  const dataRows = students.length > 0
    ? students.map((s) => [
        s.nis || '',
        s.nama || '',
        s.nilai !== undefined && s.nilai !== null && s.nilai !== '' ? Number(s.nilai) : '',
        s.keterangan || '',
      ])
    : [['12345', 'Contoh Siswa', 85, 'Tuntas']]

  const guide = [
    ['Panduan Pengisian Template Nilai Excel', ''],
    ['Ujian', examName || '-'],
    ['Kelas', className || '-'],
    ['Sheet wajib', 'Data (jangan ubah nama sheet ini)'],
    ['Kolom nis', 'Wajib diisi sesuai NIS siswa terdaftar.'],
    ['Kolom nama_siswa', 'Referensi visual guru (tidak mengubah data siswa).'],
    ['Kolom nilai', 'Wajib diisi angka antara 0 sampai 100.'],
    ['Kolom keterangan', 'Opsional (maksimal 255 karakter).'],
    ['Batas', 'Maksimal 5.000 baris data, file maksimal 5 MB (.xlsx / .xls)'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
  ws['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 30 }]
  ws['!autofilter'] = { ref: `A1:D${dataRows.length + 1}` }

  const wsGuide = XLSX.utils.aoa_to_sheet(guide)
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 60 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')

  const safeExam = (examName || 'ujian').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeClass = (className || 'kelas').replace(/[^a-zA-Z0-9_-]/g, '_')
  XLSX.writeFile(wb, `template_nilai_${safeExam}_${safeClass}.xlsx`)
}
