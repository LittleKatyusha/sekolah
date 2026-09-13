import Swal from 'sweetalert2'

export async function openOnlinePayment(text, createPayment) {
  let paymentTab
  const result = await Swal.fire({
    title: 'Bayar Online',
    text: `${text} Halaman pembayaran akan dibuka di tab baru.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Lanjut Bayar',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    preConfirm: () => {
      // Reserve the tab during the click, before waiting for the API.
      paymentTab = window.open('', '_blank')
      if (paymentTab) {
        paymentTab.opener = null
        paymentTab.document.title = 'Menyiapkan Pembayaran'
        paymentTab.document.body.textContent = 'Menyiapkan halaman pembayaran. Mohon tunggu...'
      }
    },
  })
  if (!result.isConfirmed) return false

  try {
    const { data, error } = await createPayment()
    if (error) throw new Error((typeof error === 'object' ? error.message : error) || 'Gagal membuat link pembayaran')
    const rawUrl = data?.data?.checkout_url
    let url
    try {
      url = new URL(rawUrl)
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error()
    } catch {
      throw new Error('Link pembayaran tidak tersedia atau tidak valid. Silakan coba lagi.')
    }

    const opened = paymentTab && !paymentTab.closed
    if (opened) {
      paymentTab.location.replace(url.href)
      paymentTab.focus()
    }

    const content = document.createElement('div')
    const message = document.createElement('p')
    message.textContent = opened
      ? 'Halaman pembayaran dibuka di tab baru. Jika belum terlihat, gunakan tautan berikut.'
      : 'Tab pembayaran diblokir browser atau sudah ditutup. Klik tautan berikut untuk melanjutkan pembayaran.'
    const link = document.createElement('a')
    link.href = url.href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.className = 'inline-block mt-3 text-blue-600 underline font-medium'
    link.textContent = 'Buka Halaman Pembayaran'
    content.append(message, link)
    await Swal.fire({
      title: 'Link Pembayaran Siap',
      html: content,
      icon: opened ? 'success' : 'info',
      confirmButtonText: 'Tutup',
    })
    return true
  } catch (error) {
    if (paymentTab && !paymentTab.closed) paymentTab.close()
    await Swal.fire({
      title: 'Pembayaran Belum Dibuka',
      text: error.message || 'Gagal membuat link pembayaran',
      icon: 'error',
      confirmButtonText: 'OK',
    })
    return false
  }
}