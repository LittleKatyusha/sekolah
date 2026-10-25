import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ActionsMenu } from './TugasList'
import usePermission from '../../../hooks/usePermission'

vi.mock('../../../hooks/usePermission', () => ({
  default: vi.fn(),
}))

describe('TugasList ActionsMenu permissions', () => {
  const dummyProps = {
    data: { id: 1, judul: 'Tugas Matematika' },
    onDetail: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onGrade: vi.fn(),
  }

  it('does NOT show "Nilai Siswa" for siswa role with only tugas-siswa.update', () => {
    // Siswa has tugas-siswa.update (to update own submissions), but NOT tugas-siswa.nilai
    usePermission.mockReturnValue({
      hasPermission: (perm) => perm === 'tugas-siswa.update',
    })

    render(<ActionsMenu {...dummyProps} />)
    const trigger = screen.getByTitle('Actions')
    fireEvent.click(trigger)

    expect(screen.getByText('Detail')).toBeDefined()
    expect(screen.queryByText('Nilai Siswa')).toBeNull()
  })

  it('shows "Nilai Siswa" for guru role with tugas-siswa.nilai', () => {
    usePermission.mockReturnValue({
      hasPermission: (perm) => perm === 'tugas-siswa.nilai',
    })

    render(<ActionsMenu {...dummyProps} />)
    const trigger = screen.getByTitle('Actions')
    fireEvent.click(trigger)

    expect(screen.getByText('Detail')).toBeDefined()
    expect(screen.getByText('Nilai Siswa')).toBeDefined()
  })
})
