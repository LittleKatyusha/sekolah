import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GuruForm from './GuruForm'

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}))

vi.mock('../services/guruService', () => ({
  guruService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../hooks/useReferenceOptions', () => ({
  useReferenceOptions: () => ({
    options: [{ value: '1', label: 'Laki-Laki' }, { value: '2', label: 'Perempuan' }],
    loading: false,
  }),
}))

vi.mock('../../../utils/sweetalert', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe('GuruForm no_hp validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips spaces and non-digit characters in real-time on input change', () => {
    render(<GuruForm />)
    const phoneInput = screen.getByPlaceholderText('08xxxxxxxxxx')

    fireEvent.change(phoneInput, { target: { name: 'no_hp', value: '0812 3456 7890' } })
    expect(phoneInput.value).toBe('081234567890')

    fireEvent.change(phoneInput, { target: { name: 'no_hp', value: '+62-812-abcd-9999' } })
    expect(phoneInput.value).toBe('628129999')
  })
})
