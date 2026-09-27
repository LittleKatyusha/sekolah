// Run: node scripts/check-edit-contracts.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../src/features/${path}`, import.meta.url), 'utf8')
const between = (source, start, end) => {
  assert.ok(source.includes(start) && source.includes(end), `Missing boundary: ${start}`)
  return source.split(start)[1].split(end)[0]
}
const object = (source, start, end, names, values) => Function(...names, `return ({${between(source, start, end)}})`)(...values)
const tugas = read('tugas/pages/TugasSiswaForm.jsx')
const hydrateTugas = (ts) => object(tugas, 'setFormData({', '\n      })', ['ts', 'waktuKumpl'], [ts, '2026-09-27T09:30'])
const form = hydrateTugas({ tugas_id: 101, siswa_id: 102, file_jawaban: 'jawaban.pdf', nilai: 0, status: 0 })
const presensi = object(read('presensi/pages/PresensiForm.jsx'), 'setFormData({', '\n      })', ['presensi', 'siswaId'], [{}, '1'])
assert.equal(presensi.correction_reason.trim(), '')
assert.equal(form.file_siswa, 'jawaban.pdf')
assert.equal(form.nilai, '0')
assert.equal(form.status_kumpul, '0')
assert.equal(form.mst_tugas_id, '101')
assert.equal(form.mst_siswa_id, '102')

const previousTimezone = process.env.TZ
process.env.TZ = 'Asia/Jakarta'
const payload = object(tugas, 'const submitData = {', '\n    }', ['formData'], [form])
assert.equal(payload.waktu_kumpul, '2026-09-27T02:30:00.000Z')
for (const [path, variable] of [['tugas/pages/TugasForm.jsx', 'tenggatWaktu'], ['tugas/pages/TugasSiswaForm.jsx', 'waktuKumpl']]) {
  const source = read(path)
  const expression = source.match(new RegExp(`${variable} = (new Date\\(dt\\.getTime\\(\\).*?)\\n`))[1]
  assert.equal(Function('dt', `return ${expression}`)(new Date('2026-09-27T02:30:00Z')), '2026-09-27T09:30')
}
assert.ok(!Object.hasOwn(payload, 'nilai'))
for (const [path, start, end, variable, record, expected] of [
  ['ppdb/pages/GelombangForm.jsx', 'setFormData({', '\n      })', 'g', { tgl_mulai: '2026-09-27T00:00:00Z', tgl_selesai: '2026-09-28T00:00:00Z', persentase_cadangan: 0 }, { tgl_mulai: '2026-09-27', tgl_selesai: '2026-09-28', persentase_cadangan: '0' }],
  ['ppdb/pages/PendaftarForm.jsx', 'setFormData({', '\n      })', 'p', { tanggal_lahir: '2010-01-02T00:00:00Z' }, { tanggal_lahir: '2010-01-02' }],
  ['perpustakaan/pages/BukuForm.jsx', 'setFormData({', '\n      })', 'buku', { stok: 0 }, { stok: 0 }],
]) {
  const result = object(read(path), start, end, [variable], [record])
  for (const [key, value] of Object.entries(expected)) assert.equal(result[key], value)
}
const gelombangPayload = object(read('ppdb/pages/GelombangForm.jsx'), 'const submitData = {', '\n    }', ['formData'], [{ persentase_cadangan: '0' }])
assert.equal(gelombangPayload.persentase_cadangan, 0)
const soal = object(read('soal/pages/SoalForm.jsx'), 'const submitData = {', '\n    }', ['formData'], [{ mst_mapel_id: '123', tipe: '1', pertanyaan: 'Soal' }])
assert.deepEqual(soal, { mst_mapel_id: 123, tipe: '1', pertanyaan: 'Soal' })
const bukuPayload = object(read('perpustakaan/pages/BukuForm.jsx'), 'const submitData = {', '\n    }', ['formData'], [{ stok: 0 }])
assert.equal(bukuPayload.stok, 0)
for (const field of ['tinggi_badan', 'berat_badan']) {
  const expression = read('siswa/pages/SiswaForm.jsx').match(new RegExp(`${field}: (formData\\.${field}[^\\n]+),`))[1]
  assert.equal(Function('formData', `return ${expression}`)({ [field]: 0 }), 0)
}
// These option endpoints support per_page=all; no stored ID is lost at page 100.
for (const path of ['tugas/pages/TugasSiswaForm.jsx', 'spp/pages/TarifSppForm.jsx', 'ranking/pages/RankingForm.jsx', 'organisasi/pages/OrganisasiForm.jsx', 'ppdb/pages/GelombangForm.jsx']) {
  assert.ok(!read(path).includes('per_page: 100'), path)
  assert.ok(read(path).includes("per_page: 'all'"), path)
}

// Execute the actual submission handler, including partial failure and zero-grade paths.
const submitBody = between(tugas, 'const handleSubmit = async (e) => {', '\n  const ')
  .split('\n  return (')[0].trim().replace(/\}\s*$/, '')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
for (const scenario of ['success', 'grade-failure', 'update-failure', 'unchanged', 'forbidden']) {
  const calls = []
  const service = {
    update: async (id, data) => { calls.push(['update', id, data]); return { error: scenario === 'update-failure' ? { message: 'Failed' } : null } },
    nilai: async (id, data) => { calls.push(['nilai', id, data]); return { error: scenario === 'grade-failure' ? { errors: { nilai: ['Failed'] } } : null } },
  }
  const context = {
    e: { preventDefault() {} }, validate: () => true, setLoading: () => {}, formData: form,
    isEditMode: true, id: '3', tugasSiswaService: service, canGrade: scenario !== 'forbidden',
    originalNilai: scenario === 'unchanged' ? '0' : '', setOriginalNilai: () => {},
    setErrors: () => {}, showSuccess: () => calls.push(['success']), showError: (message) => calls.push(['error', message]),
    navigate: () => calls.push(['navigate']), console: { error() {} },
  }
  await new AsyncFunction(...Object.keys(context), submitBody)(...Object.values(context))
  const grades = calls.filter(([name]) => name === 'nilai')
  assert.equal(grades.length, ['success', 'grade-failure'].includes(scenario) ? 1 : 0)
  if (grades.length) assert.equal(grades[0][2].nilai, 0)
  assert.equal(calls.some(([name]) => name === 'navigate'), !scenario.endsWith('failure'))
  if (scenario === 'grade-failure') assert.ok(calls.find(([name]) => name === 'error')[1].includes('pengumpulan tersimpan'))
}
if (previousTimezone === undefined) delete process.env.TZ
else process.env.TZ = previousTimezone
console.log('PASS: edit hydration, zero values, dates, Soal payload, grading permissions and partial failure')