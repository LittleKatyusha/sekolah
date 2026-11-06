import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ShiftList from './ShiftList'
import { shiftService } from '../services/shiftService'

vi.mock('../services/shiftService', () => ({
  shiftService: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

const mockShifts = [
  {
    id: 1,
    kode: 'DEFAULT',
    nama: 'Shift Reguler',
    jam_masuk: '07:00:00',
    jam_pulang: '14:20:00',
    toleransi_keterlambatan_menit: 15,
    is_active: true,
    jadwal_harian: {
      FRI: {
        jam_masuk: '07:00',
        jam_pulang: '11:30',
      },
    },
  },
]

describe('ShiftList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shiftService.getAll.mockResolvedValue({
      data: {
        data: mockShifts,
      },
    })
  })

  it('renders shifts and shows custom Friday schedule badge', async () => {
    render(<ShiftList />)

    await waitFor(() => {
      expect(screen.getByText('Shift Reguler')).toBeInTheDocument()
    })

    expect(screen.getByText('DEFAULT')).toBeInTheDocument()
    expect(screen.getByText('1 Hari Kustom')).toBeInTheDocument()
    expect(screen.getByText('11:30')).toBeInTheDocument()
    expect(screen.getByText('Kustom')).toBeInTheDocument()
  })
})
