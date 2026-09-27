// Run: node scripts/check-tes-minat-opsi.mjs
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
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
  const { tesMinatBakatResources } = await server.ssrLoadModule('/src/features/tes-minat-bakat/config.jsx')
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
  console.log('PASS: five options, API fields, zero values, legacy fields, empty data, escaped text')
} finally {
  await server.close()
  delete globalThis.window
}