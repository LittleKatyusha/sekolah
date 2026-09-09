import { PANDUAN_MODULES } from '../data/panduanData'

export default function ManualBookPrintView({ modules = PANDUAN_MODULES }) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="hidden print:block text-gray-900 bg-white leading-relaxed font-sans text-xs">
      {/* ─── COVER PAGE ────────────────────────────────────────────── */}
      <section
        className="flex flex-col justify-between border-4 border-indigo-900 p-10 min-h-[265mm] text-center"
        style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
      >
        <div className="space-y-3">
          <div className="inline-block px-4 py-1 bg-indigo-900 text-white font-bold tracking-widest text-xs uppercase rounded">
            Dokumen Resmi Panduan Operasional
          </div>
          <h2 className="text-xl font-bold tracking-wider text-indigo-900 uppercase">
            Platform Sistem Informasi Manajemen Sekolah
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            Ekosistem AkademiHub Terpadu (Web Dashboard • Mobile PWA • IoT RFID • TV Signage)
          </p>
        </div>

        <div className="my-auto py-10 space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-extrabold text-3xl shadow-md">
            AH
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase border-y-2 border-indigo-900 py-4 max-w-xl mx-auto">
            MANUAL BOOK &amp; PANDUAN PENGGUNA
          </h1>
          <p className="text-sm text-gray-700 max-w-lg mx-auto leading-normal">
            Buku petunjuk pengoperasian sistem, panduan teknis langkah demi langkah,
            alur kerja modul, dan penanganan kendala untuk seluruh pemangku kepentingan sekolah.
          </p>
        </div>

        <div className="border-t border-gray-300 pt-4 text-[11px] text-gray-600 space-y-1">
          <div className="flex justify-between max-w-lg mx-auto">
            <span><strong>Edisi:</strong> 2026 / 2027 (v2.4)</span>
            <span><strong>Tanggal Cetak:</strong> {currentDate}</span>
            <span><strong>Status:</strong> Rilis Resmi</span>
          </div>
        </div>
      </section>

      {/* ─── DAFTAR ISI ────────────────────────────────────────────── */}
      <section
        className="p-8 min-h-[265mm]"
        style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
      >
        <div className="border-b-2 border-indigo-900 pb-3 mb-6">
          <h2 className="text-xl font-bold uppercase text-indigo-900 tracking-wide">
            Daftar Isi Manual Book
          </h2>
          <p className="text-xs text-gray-600">
            Daftar modul, lingkup pengguna, dan platform yang didukung.
          </p>
        </div>

        <table className="w-full border-collapse text-left text-[11px] mb-6">
          <thead>
            <tr className="bg-indigo-900 text-white font-semibold">
              <th className="p-2 border border-indigo-900 w-12 text-center">Bab</th>
              <th className="p-2 border border-indigo-900">Nama Modul &amp; Fitur</th>
              <th className="p-2 border border-indigo-900 w-32">Platform</th>
              <th className="p-2 border border-indigo-900 w-44">Hak Akses (Role)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 bg-gray-50 font-medium">
              <td className="p-2 border border-gray-300 text-center font-bold">00</td>
              <td className="p-2 border border-gray-300 font-semibold text-indigo-900">
                Panduan Pemasangan Aplikasi Mobile (PWA Android &amp; iOS)
              </td>
              <td className="p-2 border border-gray-300">Smartphone</td>
              <td className="p-2 border border-gray-300">Semua Pengguna</td>
            </tr>
            {modules.map((mod, idx) => (
              <tr key={mod.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-300 text-center font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="p-2 border border-gray-300">
                  <div className="font-semibold text-gray-900">{mod.title}</div>
                  <div className="text-[10px] text-gray-500 line-clamp-1">{mod.description}</div>
                </td>
                <td className="p-2 border border-gray-300 capitalize">
                  {mod.platforms.join(', ')}
                </td>
                <td className="p-2 border border-gray-300 capitalize">
                  {mod.roles.join(', ')}
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-200 bg-gray-50 font-medium">
              <td className="p-2 border border-gray-300 text-center font-bold">
                {String(modules.length + 1).padStart(2, '0')}
              </td>
              <td className="p-2 border border-gray-300 font-semibold text-indigo-900">
                Pusat Bantuan &amp; Alur Pengajuan Tiket Kendala
              </td>
              <td className="p-2 border border-gray-300">Web &amp; Mobile</td>
              <td className="p-2 border border-gray-300">Semua Pengguna</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ─── PANDUAN PWA INSTALLATION ──────────────────────────────── */}
      <section
        className="p-8 min-h-[265mm]"
        style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
      >
        <div className="border-b-2 border-indigo-900 pb-3 mb-6">
          <div className="text-xs font-bold text-indigo-900 uppercase">Bab 00</div>
          <h2 className="text-xl font-bold uppercase text-gray-900 tracking-wide">
            Panduan Instalasi Aplikasi Mobile (PWA)
          </h2>
          <p className="text-xs text-gray-600">
            Cara memasang aplikasi AkademiHub langsung di smartphone tanpa unduhan besar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-300 pb-2 mb-3">
              📱 Android (Google Chrome)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-[11px] text-gray-700">
              <li>Buka Google Chrome di smartphone Android.</li>
              <li>Akses alamat URL web sekolah Anda.</li>
              <li>Ketuk menu titik tiga (⋮) di pojok kanan atas Chrome.</li>
              <li>Pilih opsi "Tambahkan ke Layar Utama" atau "Install Aplikasi".</li>
              <li>Tekan tombol Install. Ikon aplikasi akan otomatis terpasang.</li>
            </ol>
          </div>

          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-300 pb-2 mb-3">
              🍎 iOS / iPhone (Apple Safari)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-[11px] text-gray-700">
              <li>Buka browser resmi Safari di iPhone Anda.</li>
              <li>Akses tautan website sekolah Anda.</li>
              <li>Ketuk ikon Bagikan (Share) pada toolbar bawah Safari.</li>
              <li>Pilih menu "Add to Home Screen" (Tambah ke Layar Utama).</li>
              <li>Ketuk Add (Tambah) di sudut kanan atas. Selesai.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* ─── CHAPTERS PER MODULE ───────────────────────────────────── */}
      {modules.map((mod, idx) => (
        <section
          key={mod.id}
          className="p-8 border-b border-gray-300"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '24px' }}
        >
          <div className="border-b-2 border-indigo-900 pb-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-900 uppercase">
                BAB {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded">
                Kategori: {mod.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mt-1">
              {mod.title}
            </h2>
            <div className="flex flex-wrap gap-2 text-[10px] mt-1.5">
              <span className="font-semibold text-gray-700">Platform:</span>
              <span className="text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">
                {mod.platforms.join(' • ')}
              </span>
              <span className="font-semibold text-gray-700 ml-2">Hak Akses:</span>
              <span className="text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">
                {mod.roles.join(', ')}
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-2 italic">
              {mod.description}
            </p>
          </div>

          {mod.webGuide && mod.webGuide.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 mb-1.5">
                💻 Alur Kerja Web Dashboard
              </h3>
              <ol className="space-y-1 pl-4 list-decimal text-[11px] text-gray-800">
                {mod.webGuide.map((step, sIdx) => (
                  <li key={sIdx} className="leading-snug">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {mod.mobileGuide && mod.mobileGuide.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 mb-1.5">
                📱 Alur Kerja Aplikasi Mobile
              </h3>
              <ol className="space-y-1 pl-4 list-decimal text-[11px] text-gray-800">
                {mod.mobileGuide.map((step, sIdx) => (
                  <li key={sIdx} className="leading-snug">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {mod.troubleshooting && mod.troubleshooting.length > 0 && (
            <div className="mb-3">
              <h3 className="font-bold text-xs uppercase tracking-wide text-amber-900 mb-1.5">
                ⚠️ Solusi Masalah Populer (Troubleshooting)
              </h3>
              <table className="w-full border-collapse text-[10.5px] border border-gray-300">
                <thead>
                  <tr className="bg-amber-50 text-amber-950 font-semibold border-b border-gray-300">
                    <th className="p-1.5 border-r border-gray-300 w-1/3 text-left">Kendala</th>
                    <th className="p-1.5 text-left">Solusi &amp; Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.troubleshooting.map((t, tIdx) => (
                    <tr key={tIdx} className={tIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-1.5 border-r border-gray-300 font-medium text-gray-900 align-top">
                        {t.issue}
                      </td>
                      <td className="p-1.5 text-gray-700 align-top leading-tight">
                        {t.solution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mod.proTips && mod.proTips.length > 0 && (
            <div className="p-2 border border-blue-200 bg-blue-50/50 rounded text-[10.5px] text-blue-950">
              <span className="font-bold">💡 Tips Penggunaan: </span>
              {mod.proTips.join(' • ')}
            </div>
          )}
        </section>
      ))}

      {/* ─── PUSAT BANTUAN & SUPPORT ──────────────────────────────── */}
      <section
        className="p-8 min-h-[265mm] flex flex-col justify-between"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <div>
          <div className="border-b-2 border-indigo-900 pb-3 mb-6">
            <div className="text-xs font-bold text-indigo-900 uppercase">
              BAB {String(modules.length + 1).padStart(2, '0')}
            </div>
            <h2 className="text-xl font-bold uppercase text-gray-900 tracking-wide">
              Pusat Bantuan &amp; Alur Tiket Kendala Teknis
            </h2>
            <p className="text-xs text-gray-600">
              Layanan eskalasi resmi jika Anda membutuhkan bantuan langsung dari Tim Pengembang AkademiHub.
            </p>
          </div>

          <div className="space-y-4 text-[11px] text-gray-800">
            <div className="border border-gray-300 rounded p-4 bg-gray-50">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                🎫 Langkah Pembuatan Tiket Kendala di Aplikasi
              </h3>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Buka menu <strong>Tiket Bantuan</strong> di navigasi aplikasi atau akses <code>/support/tickets</code>.</li>
                <li>Klik tombol <strong>"Buat Tiket Baru"</strong>.</li>
                <li>Pilih <strong>Kategori Modul</strong> dan <strong>Tingkat Prioritas</strong>.</li>
                <li>Tuliskan deskripsi kronologi dan lampirkan screenshot tangkapan layar.</li>
                <li>Pantau status balasan tiket langsung melalui notifikasi web.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-indigo-900 pt-6 mt-8 text-center text-[10px] text-gray-500">
          <p className="font-semibold text-gray-700 uppercase">
            Platform AkademiHub • Hak Cipta Dilindungi Undang-Undang
          </p>
          <p className="mt-1">
            Manual Book Dokumen Resmi Sistem v2.4 • Dicetak pada {currentDate}
          </p>
        </div>
      </section>
    </div>
  )
}
