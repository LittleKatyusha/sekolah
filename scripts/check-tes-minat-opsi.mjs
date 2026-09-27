// Run: node scripts/check-tes-minat-opsi.mjs
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

globalThis.window = { location: { hostname: 'localhost' } }
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { tesMinatBakatResources, normalizeIn, normalizeOut } = await server.ssrLoadModule('/src/features/tes-minat-bakat/config.jsx')
  const field = tesMinatBakatResources.pertanyaan.detailSections
    .find((section) => section.title === 'Opsi Jawaban').fields[0]
  const render = (opsi) => renderToStaticMarkup(field.value({ opsi }))
  const labels = ['Sangat Tidak Berminat', 'Tidak Berminat', 'Netral', 'Berminat', 'Sangat Berminat']
  const html = render(labels.map((opsi, index) => ({
    id: index + 1, opsi, nilai: index + 1, nomor_urut: index + 1,
  })))
  labels.forEach((label, index) => {
    assert.ok(html.includes(`>${label}</div>`))
    assert.ok(html.includes(`Skor: ${index + 1} | Urutan: ${index + 1}`))
  })
  assert.ok(render([{ id: 1, opsi: 'API', nilai: 0, nomor_urut: 0, teks_opsi: 'Lama', skor: 9, urutan: 9 }])
    .includes('Skor: 0 | Urutan: 0'))
  assert.ok(render([{ id: 1, opsi: 'API', teks_opsi: 'Lama' }]).includes('>API</div>'))
  const legacy = render([{ id: 1, label: 'A', teks_opsi: 'Lama', skor: 2, urutan: 3 }])
  assert.ok(legacy.includes('>A - Lama</div>'))
  assert.ok(legacy.includes('Skor: 2 | Urutan: 3'))
  for (const empty of [[], null, undefined]) assert.equal(render(empty), '<span>-</span>')
  assert.ok(render([{ id: 1 }]).includes('Skor: -'))
  assert.ok(render([{ id: 1, opsi: '<script>alert(1)</script>' }]).includes('&lt;script&gt;'))
  const record = {
    tes_id: 1, aspek_id: 2, tipe_pertanyaan: 2, nomor_urut: 3,
    pertanyaan: 'Saya berminat merakit benda sederhana.',
    opsi: labels.map((opsi, index) => ({ id: index + 1, opsi, nilai: index, nomor_urut: index + 1 })),
  }
  const form = normalizeIn('pertanyaan', record)
  assert.deepEqual(form, record)
  assert.deepEqual(normalizeOut('pertanyaan', form), record)
  assert.deepEqual(normalizeOut('pertanyaan', {
    ...form, tes_id: '1', aspek_id: '2', tipe_pertanyaan: '2', nomor_urut: '3',
    opsi: form.opsi.map((opsi) => ({ ...opsi, nilai: String(opsi.nilai), nomor_urut: String(opsi.nomor_urut) })),
  }), record)
  const oldRecord = {
    trx_tes_minat_bakat_id: 1, mst_tes_minat_bakat_aspek_id: 2,
    tipe_jawaban: 2, urutan: 3, pertanyaan: record.pertanyaan,
    opsi: record.opsi.map(({ id, opsi, nilai, nomor_urut }) => ({ id, teks_opsi: opsi, skor: nilai, urutan: nomor_urut })),
  }
  assert.deepEqual(normalizeIn('pertanyaan', oldRecord), record)
  assert.deepEqual(normalizeIn('pertanyaan', {
    ...oldRecord, ...record, opsi: [{ id: 1, opsi: 'API', teks_opsi: 'Lama', nilai: 0, skor: 9, nomor_urut: 1, urutan: 9 }],
  }).opsi, [{ id: 1, opsi: 'API', nilai: 0, nomor_urut: 1 }])
  assert.equal(normalizeIn('pertanyaan', { ...oldRecord, aspek_id: null }).aspek_id, '')
  assert.equal(normalizeOut('pertanyaan', { ...form, aspek_id: '' }).aspek_id, null)
  assert.deepEqual(normalizeIn('pertanyaan', null).opsi, [])
  assert.deepEqual(normalizeOut('pertanyaan', { ...form, opsi: [] }).opsi, [])
  // Never silently drop an existing option: backend deletes omitted IDs during sync.
  assert.deepEqual(normalizeOut('pertanyaan', { ...form, opsi: [{ id: 1 }] }).opsi,
    [{ id: 1, opsi: '', nilai: null, nomor_urut: null }])

  const { default: SearchableSelect } = await server.ssrLoadModule('/src/components/ui/SearchableSelect.jsx')
  const selectOptions = {
    tes: [{ value: '1', label: 'RIASEC SMADA' }],
    aspek: [{ value: '2', label: 'Realistic' }],
  }
  for (const field of tesMinatBakatResources.pertanyaan.fields.filter((field) => field.type === 'select')) {
    const options = field.options || selectOptions[field.optionsKey]
    const selected = options.find((option) => String(option.value) === String(form[field.name]))
    assert.ok(selected, `${field.name} must have a selected option`)
    const html = renderToStaticMarkup(createElement(SearchableSelect, {
      name: field.name, value: form[field.name], options, onChange: () => {},
    }))
    assert.ok(html.includes(selected.label), `${field.name} must display the selected label`)
  }
  assert.ok(!tesMinatBakatResources.pertanyaan.fields.some((field) => field.name === 'is_active'))
  console.log('PASS: five options, API fields, zero values, legacy fields, empty data, escaped text')
  console.log('PASS: edit fields, selected dropdown labels, API payload round-trip, option IDs, nullable aspect')
} finally {
  await server.close()
  delete globalThis.window
}