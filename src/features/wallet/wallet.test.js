import { describe, expect, it } from 'vitest'
import { amount, canUseWallet, MAX_AMOUNT, qrToken, safeWalletReturn, walletError } from './wallet'
import { canAccessPath } from '../../utils/routeAccess'

describe('wallet trust boundaries', () => {
  const token = 'a'.repeat(48)
  it('accepts only local wallet QR URLs or exact public tokens', () => {
    expect(qrToken(token)).toBe(token)
    expect(qrToken(`https://school.test/wallet/pay/${token}`, 'https://school.test')).toBe(token)
    for (const value of [`https://evil.test/wallet/pay/${token}`, `https://school.test/wallet/pay/${token}?next=evil`, 'javascript:alert(1)', '123']) expect(() => qrToken(value, 'https://school.test')).toThrow()
  })
  it('preserves only safe payment destinations after login', () => {
    expect(safeWalletReturn(`/wallet/pay/${token}`)).toBe(`/wallet/pay/${token}`)
    const topup = '/wallet?topup=12345678-1234-1234-1234-123456789abc'
    expect(safeWalletReturn(topup)).toBe(topup)
    expect(safeWalletReturn(`${topup}&next=https://evil.test`)).toBe(topup)
    expect(safeWalletReturn(`${topup}&transaction_status=settlement`)).toBe(topup)
    for (const path of ['//evil.test', '/wallet/pay/invalid', '/admin/users', undefined]) expect(safeWalletReturn(path)).toBe('/dashboard')
  })
  it('validates integer monetary bounds, including zero limits', () => {
    expect(amount('0', true)).toBe(0)
    expect(amount(MAX_AMOUNT)).toBe(MAX_AMOUNT)
    for (const value of ['', '1.5', '1e3', '-1', '0', MAX_AMOUNT + 1]) expect(() => amount(value)).toThrow()
  })
  it('denies merchants and unknown roles; honors individual staff permissions', () => {
    expect(canUseWallet({ role: 'PEDAGANG', permissions: ['wallet.view-all'] })).toBe(false)
    expect(canUseWallet({ role: 'UNKNOWN' })).toBe(false)
    for (const user of [{ role: 'SISWA' }, { role: 'WALI_SISWA' }, { roles: [{ code: 'wali' }] }, { permissions: ['wallet.process-payout'] }]) {
      expect(canAccessPath(user, '/wallet')).toBe(true)
      expect(canAccessPath(user, `/wallet/pay/${token}`)).toBe(true)
    }
  })
  it('distinguishes frozen, insufficient balance, limit and disabled errors', () => {
    const messages = ['ACCOUNT_FROZEN', 'INSUFFICIENT_BALANCE', 'DAILY_LIMIT_EXCEEDED', 'WALLET_DISABLED'].map(message => walletError({ response: { data: { message } } }))
    expect(new Set(messages).size).toBe(4)
  })
})
