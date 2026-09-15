export const PANDUAN_CATEGORIES = [
  { id: 'all', label: 'Semua Modul' },
  { id: 'mobile', label: '📱 Mobile Apps & PWA' },
  { id: 'keuangan', label: '💰 Keuangan & SPP' },
  { id: 'presensi', label: '🕒 Presensi & RFID' },
  { id: 'cbt', label: '📝 CBT & Ujian Online' },
  { id: 'akademik', label: '📚 Akademik & LMS' },
  { id: 'rapor', label: '📊 Nilai & E-Rapor' },
  { id: 'bk', label: '🛡️ BK & Konseling' },
  { id: 'perpus', label: '📖 Perpustakaan' },
  { id: 'ppdb', label: '🎓 PPDB Online' },
  { id: 'ews', label: '⚠️ EWS Deteksi Dini' },
  { id: 'minat-bakat', label: '🧭 Tes Minat Bakat' },
  { id: 'kesiswaan', label: '🏆 Kesiswaan & Ekskul' },
  { id: 'waha', label: '💬 WhatsApp & Notifikasi' },
  { id: 'tv', label: '📺 Smart TV Signage' },
  { id: 'sistem', label: '🛠️ Bantuan & Sistem' },
]

export const PLATFORM_OPTIONS = [
  { id: 'all', label: 'Semua Platform' },
  { id: 'web', label: '💻 Web Dashboard' },
  { id: 'mobile', label: '📱 Mobile Apps (Android & iOS)' },
  { id: 'tv', label: '📺 Android TV & Kiosk' },
  { id: 'iot', label: '⚡ IoT RFID Scanner' },
]

export const ROLE_OPTIONS = [
  { id: 'all', label: 'Semua Peran' },
  { id: 'admin', label: 'Admin / TU' },
  { id: 'guru', label: 'Guru & Pendidik' },
  { id: 'siswa', label: 'Siswa' },
  { id: 'wali', label: 'Orang Tua / Wali' },
]

export const PANDUAN_MODULES = [
  {
    id: 'mobile_setup',
    title: 'Aplikasi Mobile (Android & iOS) & PWA',
    category: 'mobile',
    platforms: ['mobile', 'web'],
    roles: ['siswa', 'guru', 'wali', 'admin'],
    route: '/dashboard',
    description: 'Panduan instalasi dan penggunaan aplikasi mobile AkademiHub untuk siswa, orang tua, dan guru langsung dari smartphone.',
    webGuide: [
      'Buka browser Google Chrome (Android) atau Safari (iOS) dan akses alamat web sekolah AkademiHub.',
      'Klik menu browser (titik tiga di Chrome atau ikon Bagikan di Safari), lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen) atau "Install Aplikasi".',
      'Ikon AkademiHub akan otomatis muncul di layar utama smartphone Anda seperti aplikasi native Play Store/App Store.',
      'Aplikasi PWA mendukung notifikasi push instan, akses offline cache, dan kinerja super cepat tanpa memakan memori internal besar.',
    ],
    mobileGuide: [
      'Login menggunakan Username/Email akun terdaftar dan kata sandi yang telah diterbitkan sekolah.',
      'Izinkan izin Lokasi GPS jika sekolah memberlakukan presensi geofencing radius area sekolah.',
      'Aktifkan notifikasi aplikasi agar Anda langsung menerima pesan pengingat SPP, jadwal ujian, dan status presensi anak di sekolah.',
      'Gunakan navigasi utama (Beranda, Absensi, Jadwal, Tugas, Profil) untuk mengakses seluruh layanan sekolah.',
    ],
    troubleshooting: [
      {
        issue: 'Pemberitahuan push notifikasi tidak masuk di HP Android',
        solution: 'Buka Pengaturan HP > Aplikasi > AkademiHub / Chrome > Notifikasi > Pastikan opsi "Izinkan Notifikasi" dalam status Aktif (ON) dan matikan Battery Saver untuk aplikasi.',
      },
      {
        issue: 'Aplikasi meminta login ulang terus-menerus',
        solution: 'Pastikan waktu & tanggal di pengaturan smartphone diatur ke "Otomatis (Jaringan)". Perbedaan jam > 2 menit dapat membatalkan token otentikasi JWT.',
      },
    ],
    proTips: [
      'Pastikan akun selalu menggunakan username dan kata sandi terverifikasi dari pihak sekolah.',
      'Orang tua dengan beberapa anak di sekolah yang sama cukup login satu akun untuk memantau semua anaknya via fitur "Ganti Profil Anak".',
    ],
  },
  {
    id: 'keuangan_spp',
    title: 'Keuangan & Pembayaran SPP Online',
    category: 'keuangan',
    platforms: ['web', 'mobile'],
    roles: ['wali', 'siswa', 'admin'],
    route: '/keuangan/pembayaran-spp',
    description: 'Pembayaran tagihan SPP dan iuran pendidikan secara instan menggunakan Virtual Account bank, QRIS, serta pencatatan kuitansi resmi.',
    webGuide: [
      'Masuk ke menu "Keuangan" > "Pembayaran SPP" (/keuangan/pembayaran-spp).',
      'Admin/TU dapat melihat daftar tunggakan siswa per kelas, mengatur tarif bulanan via "Tarif SPP", dan mencetak kuitansi pembayaran resmi format PDF.',
      'Siswa atau Orang Tua dapat melihat daftar tagihan yang belum lunas (status kuning "Belum Lunas").',
      'Klik tombol "Bayar Sekarang" pada bulan tagihan yang ingin dibayarkan.',
      'Pilih metode pembayaran yang diinginkan (BCA VA, BRI VA, BNI VA, Mandiri VA, Permata, atau QRIS untuk GoPay/ShopeePay/DANA/OVO).',
      'Salin nomor Virtual Account atau scan kode QRIS sebelum batas waktu pembayaran berakhir (default 24 jam).',
      'Setelah transfer sukses, status otomatis berubah menjadi hijau "Lunas" dalam hitungan detik tanpa perlu upload bukti transfer fisik.',
    ],
    mobileGuide: [
      'Buka tab "Tagihan / SPP" di aplikasi mobile AkademiHub.',
      'Pilih bulan tagihan aktif, lalu ketuk "Bayar Via Online".',
      'Pilih pembayaran instan QRIS untuk membuka aplikasi mobile banking atau e-wallet di HP Anda dalam satu klik.',
      'Riwayat pembayaran tersimpan rapi dan kuitansi digital dapat diunduh kapan saja langsung ke galeri HP.',
    ],
    troubleshooting: [
      {
        issue: 'Saldo sudah terpotong di m-Banking namun status masih "Pending" atau "Belum Lunas"',
        solution: 'Tunggu 1–3 menit untuk sinkronisasi pembayaran otomatis. Jika belum berubah, klik tombol "Cek Status Pembayaran" atau refresh halaman. Jika >15 menit belum berubah, buat Tiket Bantuan dengan melampirkan screenshot bukti mutasi.',
      },
      {
        issue: 'Nomor Virtual Account kadaluwarsa (Expired)',
        solution: 'Klik tombol "Batalkan Transaksi" atau klik kembali "Bayar Sekarang" untuk membuat kode pembayaran VA / QRIS yang baru.',
      },
    ],
    proTips: [
      'Pembayaran melalui QRIS dan Virtual Account otomatis terverifikasi 24/7 bahkan di hari libur nasional.',
      'Admin sekolah dapat mengekspor rekap penerimaan SPP bulanan ke format Excel XLSX dengan satu klik.',
    ],
  },
  {
    id: 'presensi_rfid_gps',
    title: 'Presensi & Kehadiran (RFID & Geofencing GPS)',
    category: 'presensi',
    platforms: ['iot', 'mobile', 'web', 'tv'],
    roles: ['siswa', 'guru', 'admin', 'wali'],
    route: '/absensi-siswa',
    description: 'Sistem absensi terpadu multi-metode: tap kartu RFID di gerbang sekolah, absensi mobile berbasis GPS radius, dan display realtime di Android TV.',
    webGuide: [
      'Admin & Guru dapat mengakses menu "Kehadiran" > "Absensi Siswa" (/absensi-siswa) dan "Absensi Guru" (/absensi-guru).',
      'Pilih tanggal dan rombel kelas untuk melihat rekapitulasi kehadiran (Hadir, Terlambat, Izin, Sakit, Alpha).',
      'Untuk siswa yang sakit atau izin, guru piket / wali kelas dapat mengklik "Ubah Status", memilih alasan (Sakit/Izin), dan melampirkan foto surat dokter/izin.',
      'Menu "Rekap Bulanan" menyajikan persentase kehadiran per siswa untuk kebutuhan pencetakan lampiran rapor semester.',
    ],
    mobileGuide: [
      'Presensi RFID Gerbang: Tempelkan kartu pelajar RFID pada kotak reader ESP32 di gerbang sekolah saat datang dan pulang. Bunyi "Beep" menandakan presensi sukses tercatat.',
      'Presensi Mobile Geofencing: Buka menu "Absensi" di HP, pastikan Anda berada di dalam radius lingkungan sekolah, lalu konfirmasi kehadiran.',
      'Wali Murid akan langsung menerima notifikasi WhatsApp / Push Notif status kehadiran anak di sekolah.',
    ],
    troubleshooting: [
      {
        issue: 'Kartu RFID di-tap tetapi reader tidak merespons (tidak berbunyi)',
        solution: 'Pastikan kartu tidak berdekatan dengan kartu lain (seperti e-KTP atau Flazz) saat tapping. Jika tetap tidak terbaca, laporkan ke Bagian Tata Usaha untuk pendaftaran ulang UID RFID siswa.',
      },
      {
        issue: 'Presensi Mobile menampilkan error "Di Luar Radius Sekolah"',
        solution: 'Pastikan fitur GPS / Lokasi di smartphone diaktifkan dengan mode "Akurasi Tinggi" (High Accuracy). Berdirilah di tempat terbuka agar sinyal GPS satelit terkunci optimal.',
      },
    ],
    proTips: [
      'Data presensi di Android TV ditampilkan dalam format agregat persentase kehadiran sekolah untuk menjaga privasi.',
      'Siswa yang lupa membawa kartu fisik dapat meminta guru piket melakukan presensi manual melalui menu Absensi Siswa.',
    ],
  },
  {
    id: 'cbt_ujian',
    title: 'CBT & Ujian Online (Computer Based Test)',
    category: 'cbt',
    platforms: ['web', 'mobile'],
    roles: ['siswa', 'guru', 'admin'],
    route: '/akademik/ujian',
    description: 'Pelaksanaan ujian online berbasis komputer dan smartphone dilengkapi sistem keamanan Anti-Cheat, pengacakan soal, dan penilaian instan.',
    webGuide: [
      'Guru/Admin membuat paket soal di menu "Bank Soal" (/akademik/soal) dengan tipe Pilihan Ganda atau Esai, lengkap dengan kunci jawaban dan pembahasan.',
      'Atur jadwal pelaksanaan di menu "Ujian" (/akademik/ujian), tentukan durasi pengerjaan (misal 90 menit), acak urutan soal & opsi, serta rilis 6 digit Token Ujian.',
      'Selama ujian berlangsung, pengawas membuka menu "Peserta Ujian" (/akademik/ujian-user) untuk melihat status pengerjaan tiap siswa dan status koneksi.',
      'Jika siswa terkena kunci Anti-Cheat karena membuka tab lain, guru dapat mengklik tombol "Buka Kunci" untuk mengizinkan siswa melanjutkan ujian.',
      'Setelah ujian selesai, guru dapat melihat penilaian di menu Nilai Ujian (/akademik/ujian/:id/nilai) dan mengekspor ke format Excel.',
    ],
    mobileGuide: [
      'Siswa membuka menu "CBT Ujian" di laptop atau smartphone.',
      'Pilih mata pelajaran ujian yang sedang berlangsung, lalu masukkan 6 karakter Token Ujian yang diumumkan pengawas (contoh: "ABC88X").',
      'Layar akan otomatis masuk ke mode layar penuh (Full Screen).',
      'Pilih jawaban pada setiap nomor soal. Tombol navigasi soal akan berubah warna: Hijau (Sudah Dijawab), Kuning (Ragu-ragu), Abu-abu (Belum Dijawab).',
      'Jawaban tersimpan otomatis secara realtime ke server (Auto-save). Jika koneksi sempat terputus, jawaban sementara aman di storage lokal browser.',
      'Klik tombol "Selesai Ujian" di nomor terakhir setelah memeriksa seluruh jawaban.',
    ],
    troubleshooting: [
      {
        issue: 'Ujian terkunci otomatis dengan pesan "Pelanggaran Anti-Cheat Terdeteksi"',
        solution: 'Siswa dilarang beralih window/tab, membuka notifikasi WhatsApp, kalkulator, atau floating app. Siswa harus segera lapor ke Pengawas Ruangan agar ujian dibuka kunci kembali via menu Pantau Ujian.',
      },
      {
        issue: 'Token Ujian dinyatakan "Tidak Valid"',
        solution: 'Periksa kembali huruf kapital token (case-sensitive). Pastikan waktu jam di HP/laptop siswa tidak selisih jauh dengan jam server sekolah.',
      },
    ],
    proTips: [
      'Selalu aktifkan mode "Jangan Ganggu" (Do Not Disturb) di smartphone saat mengerjakan ujian agar panggilan telepon atau chat masuk tidak memicu Anti-Cheat.',
      'Gunakan tombol "Ragu-ragu" jika belum yakin dengan jawaban agar mudah ditinjau ulang sebelum mengakhiri sesi.',
    ],
  },
  {
    id: 'akademik_lms',
    title: 'Akademik, Jadwal & E-Learning (LMS)',
    category: 'akademik',
    platforms: ['web', 'mobile'],
    roles: ['guru', 'siswa', 'admin'],
    route: '/jadwal-pelajaran',
    description: 'Manajemen kurikulum pembelajaran terintegrasi: jadwal pelajaran mingguan, modul materi ajar digital, dan pengumpulan tugas online.',
    webGuide: [
      'Jadwal Pelajaran (/jadwal-pelajaran): Kurikulum mengatur distribusi jam mengajar guru, mata pelajaran, ruang kelas, dan hari operasional.',
      'Materi Pembelajaran (/akademik/materi): Guru mengunggah file bahan ajar (PDF, presentasi PPT, ringkasan Word, link video YouTube) yang dikelompokkan per topik bab.',
      'Tugas Sekolah (/akademik/tugas): Guru membuat tugas baru, menentukan batas akhir pengumpulan (deadline), dan menetapkan batas toleransi keterlambatan.',
      'Koreksi & Feedback (/akademik/tugas-siswa): Guru memeriksa lembar kerja siswa, memberikan nilai skala 0–100, serta catatan evaluasi individual.',
    ],
    mobileGuide: [
      'Siswa dapat melihat jadwal pelajaran hari ini langsung di halaman muka aplikasi mobile.',
      'Unduh materi pembelajaran untuk dibaca secara luring (offline) tanpa kuota tambahan.',
      'Kirim tugas sekolah dengan mengunggah dokumen PDF atau mengambil foto langsung lembar jawaban buku tulis menggunakan kamera HP.',
      'Dapatkan notifikasi instan saat guru selesai mengoreksi dan memberikan nilai tugas.',
    ],
    troubleshooting: [
      {
        issue: 'Gagal mengunggah file tugas (Upload Error)',
        solution: 'Pastikan ukuran file di bawah 10 Megabyte (MB) dan format dokumen sesuai yang diizinkan (.pdf, .docx, .jpg, .png). Jika foto terlalu besar, kompresi resolusi foto terlebih dahulu.',
      },
      {
        issue: 'Tombol "Kirim Tugas" terkunci / tidak bisa diklik',
        solution: 'Batas waktu (deadline) tugas telah berakhir dan guru tidak mengaktifkan opsi "Izinkan Pengumpulan Terlambat". Hubungi guru mata pelajaran terkait.',
      },
    ],
    proTips: [
      'Siswa disarankan mengubah dokumen jawaban tugas menjadi format PDF agar layout tulisan tidak bergeser saat diperiksa guru.',
    ],
  },
  {
    id: 'nilai_rapor',
    title: 'Penilaian & E-Rapor Digital (Kurikulum Merdeka)',
    category: 'rapor',
    platforms: ['web', 'mobile'],
    roles: ['guru', 'admin', 'wali', 'siswa'],
    route: '/akademik/nilai',
    description: 'Pengolahan capaian nilai siswa, kalkulasi bobot otomatis, narasi rapor berbantuan AI, dan penerbitan e-Rapor PDF ber-barcode resmi.',
    webGuide: [
      'Guru membuka menu "Akademik" > "Nilai" (/akademik/nilai) lalu memilih kelas dan mata pelajaran yang diampu.',
      'Input komponen nilai: Asesmen Formatif (Tugas/Kuis), Asesmen Sumatif Lingkup Materi (Ulangan Harian), dan Asesmen Sumatif Akhir Semester (PAS/PAT).',
      'Sistem secara otomatis menghitung Nilai Akhir (NA), predikat (A/B/C/D), dan status kelulusan terhadap KKM / Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).',
      'Pada menu "E-Rapor", wali kelas dapat men-generate narasi capaian kompetensi siswa secara otomatis menggunakan teknologi AI AkademiHub.',
      'Wali kelas dan Kepala Sekolah melakukan cetak e-Rapor resmi lengkap dengan tanda tangan digital dan QR Code validasi keaslian dokumen.',
    ],
    mobileGuide: [
      'Siswa dan Orang Tua dapat memantau grafik perkembangan nilai akademik setiap saat dari menu "Rapor & Nilai".',
      'Unduh file e-Rapor semester berformat PDF langsung ke penyimpanan smartphone untuk kebutuhan pendaftaran beasiswa atau jenjang lanjutan.',
    ],
    troubleshooting: [
      {
        issue: 'Predikat nilai siswa tidak muncul atau bertanda strip (-)',
        solution: 'Pastikan data KKM / KKTP mata pelajaran tersebut telah diisi di menu Pengaturan Kurikulum, dan semua bobot komponen nilai telah tersimpan 100%.',
      },
    ],
    proTips: [
      'Fitur Generator Narasi AI membantu guru menghemat waktu pembuatan narasi rapor untuk puluhan siswa dengan tetap memperhatikan capaian unik masing-masing siswa.',
    ],
  },
  {
    id: 'bk_konseling',
    title: 'Bimbingan Konseling (BK) & Disiplin Siswa',
    category: 'bk',
    platforms: ['web', 'mobile'],
    roles: ['guru', 'admin', 'wali'],
    route: '/bk',
    description: 'Pencatatan pelanggaran tata tertib, akumulasi poin disiplin, sesi konseling terjadwal, dan pemanggilan orang tua secara transparan.',
    webGuide: [
      'Guru BK / Tim Disiplin membuka menu "BK" (/bk) untuk memantau tren kasus siswa di sekolah.',
      'Catat pelanggaran di sub-menu "Kasus" (/bk/kasus): pilih nama siswa, kategori pelanggaran (ringan/sedang/berat), dan bobot poin pelanggaran sesuai tata tertib sekolah.',
      'Jadwalkan sesi bimbingan di sub-menu "Sesi Konseling" (/bk/sesi) lengkap dengan tanggal, ruangan, dan rekomendasi tindak lanjut.',
      'Data kasus yang bersifat sensitif dapat ditandai sebagai "Kasus Rahasia" sehingga hanya dapat diakses oleh Guru BK yang bersangkutan dan Kepala Sekolah.',
      'Cetak surat panggilan orang tua / wali murid secara otomatis jika akumulasi poin siswa telah mencapai batas peringatan (SP 1, SP 2, SP 3).',
    ],
    mobileGuide: [
      'Orang tua menerima pemberitahuan resmi di aplikasi mobile jika siswa mendapatkan catatan pelanggaran atau jadwal sesi konseling.',
      'Orang tua dapat melihat transparansi riwayat poin pembinaan siswa.',
    ],
    troubleshooting: [
      {
        issue: 'Guru mata pelajaran umum tidak dapat melihat detail kasus BK siswa',
        solution: 'Hal ini merupakan proteksi privasi (Role-Based Access Control). Catatan detail psikologis dan konseling hanya dapat diakses oleh akun Guru BK demi menjaga etika konseling siswa.',
      },
    ],
    proTips: [
      'Sistem BK AkademiHub juga mencatat poin prestasi siswa (non-akademik/akademik) sebagai pengurang akumulasi poin pelanggaran.',
    ],
  },
  {
    id: 'perpustakaan_digital',
    title: 'Perpustakaan Digital & Sirkulasi Buku',
    category: 'perpus',
    platforms: ['web', 'mobile'],
    roles: ['siswa', 'guru', 'admin'],
    route: '/perpustakaan/buku',
    description: 'Manajemen katalog buku perpustakaan ber-ISBN/barcode, peminjaman mandiri, pengembalian buku, dan kalkulasi denda keterlambatan.',
    webGuide: [
      'Pustakawan membuka menu "Perpustakaan" > "Daftar Buku" (/perpustakaan/buku) untuk input master buku fisik maupun koleksi e-book digital.',
      'Peminjaman Buku: Scan barcode buku atau ketik judul buku, pilih nama siswa peminjam, sistem otomatis mencatat tanggal pinjam dan tanggal jatuh tempo (default 7 hari).',
      'Pengembalian Buku: Scan kembali barcode buku, sistem memeriksa apakah terdapat keterlambatan pengembalian.',
      'Jika terlambat, sistem otomatis mengkalkulasikan total denda berdasarkan tarif harian sekolah dan mencetak bukti pembayaran denda.',
    ],
    mobileGuide: [
      'Siswa dapat mencari ketersediaan stok buku secara online sebelum datang ke ruang perpustakaan sekolah.',
      'Cek masa pinjam dan tanggal jatuh tempo buku yang sedang dipinjam langsung dari menu Perpustakaan di HP.',
      'Pantau riwayat peminjaman buku untuk menghindari keterlambatan pengembalian.',
    ],
    troubleshooting: [
      {
        issue: 'Status buku tertulis "Stok Habis" padahal buku ada di rak',
        solution: 'Pustakawan perlu memeriksa tabel sirkulasi apakah ada buku yang sudah dikembalikan secara fisik namun belum di-klik "Selesaikan Pengembalian" di sistem.',
      },
    ],
    proTips: [
      'Gunakan scanner barcode wireless atau kamera smartphone untuk mempercepat proses sirkulasi peminjaman buku saat jam istirahat sekolah.',
    ],
  },
  {
    id: 'ppdb_online',
    title: 'PPDB Online & Seleksi Berbobot SPK',
    category: 'ppdb',
    platforms: ['web', 'mobile'],
    roles: ['admin', 'siswa', 'wali'],
    route: '/ppdb',
    description: 'Penerimaan Peserta Didik Baru terpadu mulai dari formulir pendaftaran online, verifikasi dokumen, hingga seleksi otomatis berbobot SMART/SAW.',
    webGuide: [
      'Panitia PPDB mengatur gelombang pendaftaran, jalur masuk (Zonasi, Prestasi, Afirmasi, Tes), kuota per jurusan, dan bobot kriteria seleksi SPK.',
      'Verifikasi Dokumen: Panitia mengecek keabsahan berkas yang diunggah pendaftar (KK, Akta Kelahiran, Nilai Rapor SMP, Sertifikat Prestasi).',
      'Setelah verifikasi disetujui, sistem Decision Support System (SPK) menghitung skor akhir setiap calon siswa secara otomatis dan transparan.',
      'Publikasikan pengumuman hasil seleksi dengan satu klik ke portal publik PPDB sekolah.',
    ],
    mobileGuide: [
      'Calon siswa / orang tua membuka portal PPDB melalui smartphone tanpa harus datang antre ke sekolah.',
      'Isi formulir biodata lengkap, foto berkas pendukung langsung dari kamera HP, lalu kirim formulir pendaftaran.',
      'Unduh Bukti Pendaftaran resmi ber-QR Code untuk syarat verifikasi fisik jika diperlukan.',
      'Pantau posisi ranking seleksi dan status kelulusan secara realtime dari genggaman.',
    ],
    troubleshooting: [
      {
        issue: 'Gagal mengunggah foto berkas KK / Akta Kelahiran',
        solution: 'Pastikan ukuran file di bawah 2 MB dan format gambar JPG/PNG jelas terbaca (tidak buram/gelap).',
      },
      {
        issue: 'NISN tidak terdeteksi atau sudah digunakan',
        solution: 'Satu nomor NISN hanya dapat mendaftar satu kali per tahun ajaran. Hubungi panitia PPDB jika terjadi kesalahan input NISN sebelumnya.',
      },
    ],
    proTips: [
      'Calon siswa yang telah dinyatakan Lulus dapat langsung mengklik tombol "Daftar Ulang" dan melanjutkan proses pembayaran biaya seragam/SPP di sistem.',
    ],
  },
  {
    id: 'ews_deteksi_dini',
    title: 'EWS (Early Warning System) Deteksi Dini Siswa',
    category: 'ews',
    platforms: ['web', 'mobile'],
    roles: ['admin', 'guru', 'wali'],
    route: '/ews',
    description: 'Sistem kecerdasan peringatan dini untuk mendeteksi risiko penurunan prestasi, ketidakhadiran berulang, dan tunggakan administrasi siswa.',
    webGuide: [
      'Buka menu "EWS" (/ews) untuk melihat radar peta risiko siswa se-sekolah.',
      'Mesin pintar EWS AkademiHub bekerja otomatis menganalisis 3 parameter utama:',
      '1. Parameter Presensi: Siswa yang alpha ≥ 3 hari berturut-turut atau terlambat > 5 kali dalam satu bulan.',
      '2. Parameter Akademik: Nilai ujian / tugas yang jatuh di bawah ambang batas KKM pada 2 mata pelajaran atau lebih.',
      '3. Parameter Finansial: Tunggakan tagihan SPP melewati batas toleransi 2 bulan berturut-turut.',
      'Wali Kelas dan Guru BK menerima daftar rekomendasi intervensi terstruktur (jadwal home visit, konseling, bimbingan remedial).',
    ],
    mobileGuide: [
      'Wali kelas menerima notifikasi alert EWS di smartphone jika ada anak perwaliannya yang membutuhkan perhatian khusus hari ini.',
      'Orang tua menerima pesan edukatif dan solusi pendampingan anak sebelum kendala akademik menjadi lebih berat.',
    ],
    troubleshooting: [
      {
        issue: 'Alert EWS muncul padahal siswa memiliki surat izin dokter resmi',
        solution: 'Periksa menu Absensi Siswa. Pastikan guru piket telah memperbarui status dari "Alpha" menjadi "Sakit". Mesin EWS akan merefresh status risiko dalam kalkulasi periode berikutnya.',
      },
    ],
    proTips: [
      'Tindakan preventif melalui alert EWS terbukti menurunkan angka putus sekolah dan remedial massal di akhir semester.',
    ],
  },
  {
    id: 'minat_bakat_riasec',
    title: 'Tes Minat Bakat (Holland RIASEC)',
    category: 'minat-bakat',
    platforms: ['web', 'mobile'],
    roles: ['siswa', 'guru'],
    route: '/akademik/tes-minat-bakat',
    description: 'Asesmen psikologi terstandarisasi untuk memetakan potensi diri siswa ke dalam 6 tipe kepribadian karir serta rekomendasi jurusan studi.',
    webGuide: [
      'Guru BK membuka menu "Akademik" > "Tes Minat Bakat" (/akademik/tes-minat-bakat) untuk melihat bank instrumen kuesioner dan mengatur jadwal pengerjaan tes untuk jenjang kelas.',
      'Setelah siswa menyelesaikan tes, sistem mengkalkulasikan skor pada 6 dimensi Holland RIASEC:',
      '• R - Realistic (Praktikal, Teknik, Mekanik, Fisik)',
      '• I - Investigative (Peneliti, Analitis, Sains, Matematika)',
      '• A - Artistic (Kreatif, Desain, Musik, Sastra)',
      '• S - Social (Komunikasi, Pengajaran, Kesehatan, Konseling)',
      '• E - Enterprising (Kepemimpinan, Bisnis, Negosiasi, Manajemen)',
      '• C - Conventional (Terstruktur, Administrasi, Akuntansi, Data)',
      'Guru BK dapat mencetak laporan psikogram komprehensif format PDF untuk bahan konsultasi penjurusan SMA/SMK atau perguruan tinggi.',
    ],
    mobileGuide: [
      'Siswa mengerjakan tes minat bakat secara mandiri dari smartphone dengan menjawab pilihan pernyataan sesuai kepribadian masing-masing.',
      'Grafik radar chart RIASEC interaktif langsung dapat dilihat begitu tes selesai.',
      'Daftar rekomendasi program studi universitas dan profesi karir masa depan disajikan lengkap dengan deskripsi kecocokan.',
    ],
    troubleshooting: [
      {
        issue: 'Siswa tidak sengaja keluar browser saat mengerjakan tes minat bakat',
        solution: 'Jawaban yang telah dipilih tersimpan di database. Siswa cukup membuka kembali menu tes untuk melanjutkan nomor pertanyaan terakhir.',
      },
    ],
    proTips: [
      'Siswa dianjurkan menjawab dengan spontan dan jujur sesuai preferensi pribadi, bukan berdasarkan apa yang dianggap ideal oleh orang lain.',
    ],
  },
  {
    id: 'kesiswaan_ekskul',
    title: 'Kesiswaan & Ekstrakurikuler',
    category: 'kesiswaan',
    platforms: ['web', 'mobile'],
    roles: ['siswa', 'guru', 'admin'],
    route: '/ekstrakurikuler',
    description: 'Pendaftaran kegiatan ekstrakurikuler, presensi jadwal latihan mingguan, rekapitulasi keaktifan, dan penilaian predikat ekskul untuk rapor.',
    webGuide: [
      'Waka Kesiswaan membuka menu "Kesiswaan" > "Ekstrakurikuler" (/ekstrakurikuler) untuk mendata cabang ekskul aktif (Pramuka, PMR, Paskibra, Futsal, Robotik, Seni, dll).',
      'Tetapkan Guru Pembina dan Pelatih untuk setiap ekstrakurikuler.',
      'Pembina melakukan absensi kegiatan mingguan dan menginput predikat nilai capaian ekskul (Sangat Baik / Baik / Cukup) menjelang penutupan semester rapor.',
    ],
    mobileGuide: [
      'Siswa dapat melihat profil pembina, deskripsi program, dan mendaftar kegiatan ekstrakurikuler favorit di awal tahun ajaran secara mandiri.',
      'Lihat jadwal latihan mingguan dan catatan presensi kehadiran ekskul langsung di HP.',
    ],
    troubleshooting: [
      {
        issue: 'Nilai ekskul tidak muncul di e-Rapor siswa',
        solution: 'Pastikan Pembina Ekskul telah mengunci nilai di menu input nilai ekskul dan siswa tersebut terdaftar resmi di rombel ekskul semester aktif.',
      },
    ],
    proTips: [
      'Ekskul wajib (seperti Pramuka) dapat diset otomatis diikuti oleh seluruh siswa tingkat kelas tertentu oleh Admin.',
    ],
  },
  {
    id: 'waha_notifikasi',
    title: 'WhatsApp Gateway & Notifikasi Sekolah (WAHA)',
    category: 'waha',
    platforms: ['web'],
    roles: ['admin', 'guru'],
    route: '/waha/session',
    description: 'Konektivitas WhatsApp otomatis (WAHA) untuk broadcast pengumuman resmi, notifikasi kehadiran anak ke orang tua, dan pengingat tagihan SPP.',
    webGuide: [
      'Buka menu "WhatsApp" > "Session" (/waha/session).',
      'Scan QR Code menggunakan aplikasi WhatsApp resmi sekolah di ponsel operasional (Menu WhatsApp Web / Tautkan Perangkat).',
      'Setelah status session berubah menjadi "CONNECTED" (hijau), seluruh otomatisasi pesan aktif:',
      '• Notifikasi Presensi: Terkirim otomatis saat siswa tap kartu RFID di gerbang.',
      '• Notifikasi SPP: Terkirim otomatis saat tagihan baru terbit atau saat konfirmasi pelunasan sukses.',
      '• Broadcast Pengumuman: Gunakan menu "Kirim Pesan" (/waha/send) untuk mengirim pesan pengumuman penting ke seluruh wali murid per kelas.',
    ],
    mobileGuide: [
      'Orang tua dan siswa tidak perlu menginstal aplikasi tambahan khusus untuk menerima pesan WhatsApp resmi.',
      'Pesan WAHA dilengkapi header resmi nama sekolah dan format rapi.',
    ],
    troubleshooting: [
      {
        issue: 'Pesan WhatsApp tidak terkirim (Status Disconnected)',
        solution: 'Buka menu WAHA Session, jika sesi terputus (Disconnected), klik "Restart Session" atau scan ulang QR Code dengan WhatsApp sekolah. Pastikan ponsel WA sekolah memiliki koneksi internet aktif.',
      },
      {
        issue: 'Nomor HP tujuan tidak menerima pesan',
        solution: 'Pastikan nomor HP di master data Wali Siswa menggunakan format internasional yang benar tanpa spasi, diawali dengan angka 62 (contoh: 6281234567890).',
      },
    ],
    proTips: [
      'Gunakan fitur variabel template dinamis (seperti {nama_siswa}, {bulan_spp}, {jam_masuk}) untuk membuat pesan broadcast terasa personal.',
    ],
  },
  {
    id: 'smart_tv_signage',
    title: 'Smart TV Digital Signage (Android TV)',
    category: 'tv',
    platforms: ['tv'],
    roles: ['admin'],
    route: null,
    description: 'Display informasi digital dinamis untuk layar TV lobi sekolah, pengumuman agenda, slide kegiatan, dan ringkasan kehadiran siswa realtime.',
    webGuide: [
      'Smart TV beroperasi menggunakan aplikasi native Android TV AkademiHub.',
      'Di layar Android TV sekolah, nyalakan aplikasi AkademiHub TV. Layar akan menampilkan 6 digit Kode Pairing unik.',
      'Admin mengotorisasi kode pairing perangkat melalui backend pairing API untuk menghubungkan TV ke sekolah.',
      'Setelah terhubung, layar TV otomatis menjalankan mode carousel informasi sekolah: identitas sekolah, jadwal pelajaran aktif, agenda kalender, pengumuman resmi, dan ringkasan presensi.',
    ],
    mobileGuide: [
      'Aplikasi TV dioperasikan khusus melalui perangkat Android TV, Smart TV Display sekolah, atau TV Box berbasis Android.',
    ],
    troubleshooting: [
      {
        issue: 'Tampilan TV tidak memperbarui data terbaru',
        solution: 'TV menyinkronkan data via HTTP snapshot polling berkala. Jika koneksi TV terputus, TV tetap menampilkan snapshot terakhir dari cache lokal hingga koneksi pulih.',
      },
    ],
    proTips: [
      'Ringkasan presensi di TV hanya menampilkan data agregat sekolah (total hadir, izin, sakit, persentase) demi menjaga privasi dan keamanan data siswa.',
    ],
  },
  {
    id: 'helpdesk_support',
    title: 'Pusat Bantuan & Tiket Kendala (AI Support)',
    category: 'sistem',
    platforms: ['web', 'mobile'],
    roles: ['siswa', 'guru', 'wali', 'admin'],
    route: '/support/tickets',
    description: 'Layanan helpdesk 24/7 berbantuan AI untuk konsultasi kendala sistem, panduan mandiri otomatis, dan eskalasi langsung ke tim teknis.',
    webGuide: [
      'Buka menu "Tiket Bantuan" (/support/tickets).',
      'Klik tombol "Buat Tiket Baru" jika Anda mengalami kendala pada fitur aplikasi atau memiliki pertanyaan yang belum terjawab.',
      'Pilih kategori kendala: Teknis / Akun, Keuangan / SPP, Akademik / Nilai, atau Pertanyaan Umum.',
      'Tuliskan judul dan jelaskan kendala Anda secara detail. Anda dapat melampirkan screenshot bukti kendala (format JPG, PNG, atau PDF).',
      'Klik "Kirim Tiket". Sistem AI AkademiHub akan langsung membaca keluhan Anda dalam hitungan detik dan memberikan solusi langkah demi langkah terverifikasi.',
      'Jika kendala membutuhkan penanganan khusus admin (seperti perbaikan data induk atau reset database), AI otomatis mengalihkan tiket ke Tim Teknis Sekolah.',
    ],
    mobileGuide: [
      'Akses menu "Bantuan" langsung dari profil akun di smartphone.',
      'Ketik kendala Anda, lampirkan screenshot galeri HP, dan pantau balasan solusi langsung dari notifikasi aplikasi.',
    ],
    troubleshooting: [
      {
        issue: 'Tiket ditandai status "Dialihkan ke Tim Teknis"',
        solution: 'Artinya kendala Anda memerlukan tindakan manual oleh Staf Administrasi / IT Sekolah. Tim sekolah akan menindaklanjuti dalam waktu 1x24 jam kerja.',
      },
    ],
    proTips: [
      'Gunakan fitur pencarian pada halaman Petunjuk Penggunaan ini terlebih dahulu untuk mendapatkan solusi instan sebelum membuat tiket kendala.',
    ],
  },
]
