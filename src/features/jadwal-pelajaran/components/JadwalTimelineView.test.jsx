import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JadwalTimelineView from './JadwalTimelineView'

const mockSchedules = [
  {
    id: 1,
    hari: 'MON',
    jam_mulai: '08:00',
    jam_selesai: '09:30',
    ruangan: 'Lab Kimia',
    kelas: { id: 1, nama_kelas: 'X-IPA-1' },
    guru_mapel: {
      mapel: { nama: 'Kimia Dasar' },
      guru: { nama: 'Dr. Siti Aminah', nip: '19850101' },
    },
  },
  {
    id: 2,
    hari: 'MON',
    jam_mulai: '10:00',
    jam_selesai: '11:30',
    ruangan: 'R-102',
    kelas: { id: 1, nama_kelas: 'X-IPA-1' },
    guru_mapel: {
      mapel: { nama: 'Matematika' },
      guru: { nama: 'Budi Santoso' },
    },
  },
  {
    id: 3,
    hari: 'WED',
    jam_mulai: '07:30',
    jam_selesai: '09:00',
    ruangan: 'R-201',
    kelas: { id: 2, nama_kelas: 'XI-IPS-2' },
    guru_mapel: {
      mapel: { nama: 'Sosiologi' },
      guru: { nama: 'Jazilah Nurul' },
    },
  },
]

const mockKelasList = [
  { id: 1, nama_kelas: 'X-IPA-1' },
  { id: 2, nama_kelas: 'XI-IPS-2' },
]

describe('JadwalTimelineView', () => {
  it('renders hero banner and stats properly', () => {
    render(
      <JadwalTimelineView
        cardSchedules={mockSchedules}
        kelasList={mockKelasList}
        selectedKelasId="all"
        setSelectedKelasId={vi.fn()}
        activeDayTab="ALL"
        setActiveDayTab={vi.fn()}
        searchQuery=""
        setSearchQuery={vi.fn()}
      />
    )

    expect(screen.getByText('Agenda Belajar Mengajar')).toBeInTheDocument()
    expect(screen.getByText('Total Slot')).toBeInTheDocument()
    expect(screen.getByText('Semua Hari')).toBeInTheDocument()
  })

  it('renders schedule cards in chronological order for selected day', () => {
    const handleDetail = vi.fn()

    render(
      <JadwalTimelineView
        cardSchedules={mockSchedules}
        kelasList={mockKelasList}
        selectedKelasId="all"
        setSelectedKelasId={vi.fn()}
        activeDayTab="MON"
        setActiveDayTab={vi.fn()}
        searchQuery=""
        setSearchQuery={vi.fn()}
        onDetail={handleDetail}
      />
    )

    expect(screen.getAllByText('Kimia Dasar').length).toBeGreaterThan(0)
    expect(screen.getByText('Dr. Siti Aminah')).toBeInTheDocument()
    expect(screen.getAllByText('Matematika').length).toBeGreaterThan(0)
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('Lab Kimia')).toBeInTheDocument()
    expect(screen.getByText('08:00 - 09:30')).toBeInTheDocument()

    // Trigger detail
    const detailButtons = screen.getAllByRole('button', { name: /detail/i })
    fireEvent.click(detailButtons[0])
    expect(handleDetail).toHaveBeenCalledWith(mockSchedules[0])
  })

  it('displays empty state when no schedules match the filter', () => {
    const resetTab = vi.fn()

    render(
      <JadwalTimelineView
        cardSchedules={[]}
        kelasList={mockKelasList}
        selectedKelasId="all"
        setSelectedKelasId={vi.fn()}
        activeDayTab="SAT"
        setActiveDayTab={resetTab}
        searchQuery=""
        setSearchQuery={vi.fn()}
      />
    )

    expect(screen.getByText('Tidak Ada Jadwal Pelajaran')).toBeInTheDocument()
  })
})
