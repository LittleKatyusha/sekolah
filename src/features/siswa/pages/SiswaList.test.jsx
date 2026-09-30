import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SiswaList from './SiswaList'

vi.mock('../../../components/ui/InfiniteGrid', () => ({
  default: ({ columnDefs }) => {
    const column = columnDefs.find(({ field }) => field === 'rfid_uid')
    return <>{[
      { id: 1, nama: 'Ani', rfid_uid: 'A1B2C3D4' },
      { id: 2, nama: 'Budi', rfid_uid: null },
      { id: 3, nama: 'Citra' },
    ].map((data) => <div key={data.id}>{column.cellRenderer({ data, value: data.rfid_uid })}</div>)}</>
  },
}))
vi.mock('../../../components/guards/PermissionGuard', () => ({ default: ({ children }) => children }))
vi.mock('./ImportSiswaModal', () => ({ default: () => null }))
vi.mock('../services/siswaService', () => ({ siswaService: {} }))
vi.mock('../components/RfidEnrollment', () => ({ default: ({ siswa }) => <p>Scan kartu untuk {siswa.nama}</p> }))

describe('RFID siswa pada tabel', () => {
  it('menandai kartu terdaftar tanpa menghalangi perubahan', () => {
    render(<MemoryRouter initialEntries={['/siswa']}><Routes>
      <Route path="/siswa" element={<SiswaList />} />
      <Route path="/siswa/1/edit" element={<p>Edit siswa Ani</p>} />
    </Routes></MemoryRouter>)
    expect(screen.getByText('Terdaftar')).toBeInTheDocument()
    expect(screen.getByText('Belum terdaftar')).toBeInTheDocument()
    expect(screen.getByText('Tidak tersedia')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ganti RFID Ani via scan' }))
    expect(screen.getByText('Scan kartu untuk Ani')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daftarkan RFID Budi via scan' })).toBeDisabled()
  })
})
