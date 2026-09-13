import assert from 'node:assert/strict'
import Swal from 'sweetalert2'
import { openOnlinePayment } from './onlinePayment.js'

const checkout = 'https://app.sandbox.midtrans.com/snap/v2/vtweb/test'
const originalFire = Swal.fire
try {
  for (const scenario of ['success', 'blocked', 'closed', 'cancel', 'error', 'throw', 'missing', 'unsafe']) {
    const events = []
    const dialogs = []
    const tab = {
      closed: scenario === 'closed',
      opener: {},
      document: { body: {} },
      location: { replace: url => events.push(['navigate', url]) },
      focus: () => events.push('focus'),
      close: () => events.push('close'),
    }
    globalThis.window = { open: () => {
      events.push('open')
      return scenario === 'blocked' ? null : tab
    } }
    globalThis.document = { createElement: tag => ({ tag, append(...children) { this.children = children } }) }
    Swal.fire = async options => {
      dialogs.push(options)
      if (options.preConfirm && scenario !== 'cancel') options.preConfirm()
      return { isConfirmed: scenario !== 'cancel' }
    }
    const success = await openOnlinePayment('Bayar April 2026?', async () => {
      events.push('request')
      if (scenario === 'throw') throw new Error('Network error')
      return {
        error: scenario === 'error' ? { message: 'Ditolak' } : null,
        data: { data: { checkout_url: scenario === 'missing' ? undefined : scenario === 'unsafe' ? 'javascript:alert(1)' : checkout } },
      }
    })
    if (scenario === 'cancel') {
      assert.equal(success, false)
      assert.deepEqual(events, [])
      continue
    }
    assert.deepEqual(events.slice(0, 2), ['open', 'request'])
    if (['error', 'throw', 'missing', 'unsafe'].includes(scenario)) {
      assert.equal(success, false)
      assert.deepEqual(events, ['open', 'request', 'close'])
      assert.equal(dialogs[1].icon, 'error')
      continue
    }
    assert.equal(success, true)
    const link = dialogs[1].html.children[1]
    assert.equal(link.href, checkout)
    assert.equal(link.target, '_blank')
    assert.equal(link.rel, 'noopener noreferrer')
    if (scenario === 'success') {
      assert.equal(tab.opener, null)
      assert.deepEqual(events.slice(2), [['navigate', checkout], 'focus'])
    } else {
      assert.equal(dialogs[1].icon, 'info')
      assert.equal(events.length, 2)
    }
  }
  console.log('PASS: 8 online payment scenarios')
} finally {
  Swal.fire = originalFire
  delete globalThis.window
  delete globalThis.document
}