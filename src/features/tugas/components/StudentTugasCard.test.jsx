import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StudentTugasCard from './StudentTugasCard'

describe('StudentTugasCard', () => {
  const dummyTugas = {
    id: 10,
    judul: 'Tugas Sosiologi Kelas X',
    deskripsi: '<p>Kerjakan ringkasan materi sosiologi bab 1.</p>',
    tenggat_waktu: '2026-10-30T10:00:00+00:00',
    file_lampiran: 'https://example.com/lampiran.pdf',
    status: 1,
    guru_mapel: {
      id: 2,
      guru: { id: 5, nama: 'Jazilah Nurul' },
      mapel: { id: 8, kode: 'SOS', nama: 'Sosiologi' },
    },
    kelas: { id: 1, nama_kelas: 'X' },
  }

  it('renders assignment information, badges, and teacher correctly', () => {
    const handleOpen = vi.fn()
    const handleSubmit = vi.fn()

    render(
      <StudentTugasCard
        tugas={dummyTugas}
        submission={null}
        onOpen={handleOpen}
        onSubmit={handleSubmit}
      />
    )

    expect(screen.getByText('Tugas Sosiologi Kelas X')).toBeInTheDocument()
    expect(screen.getByText(/Kerjakan ringkasan materi sosiologi bab 1/i)).toBeInTheDocument()
    expect(screen.getByText(/SOS • Sosiologi/i)).toBeInTheDocument()
    expect(screen.getByText('Kelas X')).toBeInTheDocument()
    expect(screen.getByText(/Jazilah Nurul/i)).toBeInTheDocument()
    expect(screen.getByText(/Kumpulkan Tugas/i)).toBeInTheDocument()

    // Test submit click
    fireEvent.click(screen.getByText(/Kumpulkan Tugas/i))
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('displays submitted and graded status correctly', () => {
    const handleOpen = vi.fn()

    const submission = {
      id: 99,
      nilai: 95,
      status: 3,
      waktu_kumpul: '2026-10-25T08:00:00+00:00',
    }

    render(
      <StudentTugasCard
        tugas={dummyTugas}
        submission={submission}
        onOpen={handleOpen}
      />
    )

    expect(screen.getByText(/Nilai: 95/i)).toBeInTheDocument()
    expect(screen.getByText(/Lihat Nilai & Detail/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Lihat Nilai & Detail/i))
    expect(handleOpen).toHaveBeenCalledTimes(1)
  })
})
