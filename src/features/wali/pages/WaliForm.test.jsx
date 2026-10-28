import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WaliForm from './WaliForm'

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}))

vi.mock('../services/waliService', () => ({
  waliService: {
    createWali: vi.fn(),
    getWaliById: vi.fn(),
    updateWali: vi.fn(),
  },
}))

vi.mock('../../../services/referenceService', () => ({
  default: {
    getReferencesByCategory: vi.fn().mockResolvedValue({
      data: { success: true, data: [{ kode: 1, nama: 'Pilihan 1' }] },
    }),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('WaliForm numeric inputs validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips non-digits in real-time for no_hp and nik', async () => {
    render(<WaliForm />)

    const phoneInput = await screen.findByPlaceholderText('08xxxxxxxxxx')
    fireEvent.change(phoneInput, { target: { name: 'no_hp', value: '0812-3456-7890' } })
    expect(phoneInput.value).toBe('081234567890')

    const nikInput = screen.getByPlaceholderText('Nomor Induk Kependudukan')
    fireEvent.change(nikInput, { target: { name: 'nik', value: '3201 0123 4567 0001' } })
    expect(nikInput.value).toBe('3201012345670001')
  })
})
