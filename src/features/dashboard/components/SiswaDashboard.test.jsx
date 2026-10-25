import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SiswaDashboard from './SiswaDashboard'

// Mock recharts ResponsiveContainer to render children in test env
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div className="recharts-mock">{children}</div>,
  }
})

vi.mock('./DashboardAttendanceCard', () => ({
  default: () => <div data-testid="attendance-card">Mock Attendance Card</div>,
}))

describe('SiswaDashboard', () => {
  it('correctly displays Hadir and Terlambat in attendance summary with 100% hadir rate', () => {
    const mockData = {
      profile: { nama: 'SANIA FITRI', nis: '252610024', kelas: 'XI' },
      attendance_summary: [
        { status: 1, total: 14, status_label: 'Belum Absen' },
        { status: 5, total: 1, status_label: 'Belum Absen' },
      ],
      unpaid_spp: [],
      recent_grades: [{ id: 1, nilai: 85 }],
      upcoming_tasks: [{ id: 1, judul: 'Tugas 1' }],
    }

    render(
      <MemoryRouter>
        <SiswaDashboard data={mockData} authUser={{ role: 'siswa' }} />
      </MemoryRouter>
    )

    // Should resolve status 1 to Hadir and status 5 to Terlambat, NOT "Belum Absen"
    expect(screen.queryByText(/Belum Absen 14/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Belum Absen 1/i)).not.toBeInTheDocument()

    // Legend should show Hadir 14 and Terlambat 1
    const hadirLabels = screen.getAllByText('Hadir')
    expect(hadirLabels.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('Terlambat')).toBeInTheDocument()
    const oneLabels = screen.getAllByText('1')
    expect(oneLabels.length).toBeGreaterThanOrEqual(1)

    // Stat card Kehadiran and Donut center should be 100%
    const pctElements = screen.getAllByText('100%')
    expect(pctElements.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty attendance data gracefully', () => {
    const mockData = {
      profile: { nama: 'BUDI', nis: '12345' },
      attendance_summary: [],
      unpaid_spp: [],
      recent_grades: [],
      upcoming_tasks: [],
    }

    render(
      <MemoryRouter>
        <SiswaDashboard data={mockData} authUser={{ role: 'siswa' }} />
      </MemoryRouter>
    )

    expect(screen.getByText('Belum ada data kehadiran')).toBeInTheDocument()
  })
})
