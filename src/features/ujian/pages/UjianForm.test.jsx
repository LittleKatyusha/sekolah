import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UjianForm from './UjianForm'
import { semesterService } from '../../semester/services/semesterService'
import { mapelService } from '../../mapel/services/mapelService'
import { kelasService } from '../../kelas/services/kelasService'
import { ujianService } from '../services/ujianService'

vi.mock('../../semester/services/semesterService', () => ({
  semesterService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../../mapel/services/mapelService', () => ({
  mapelService: {
    getMapel: vi.fn(),
  },
}))

vi.mock('../../kelas/services/kelasService', () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock('../services/ujianService', () => ({
  ujianService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../../hooks/useReferenceOptions', () => ({
  useReferenceOptions: () => ({
    options: [{ value: '1', label: 'Penilaian Harian' }],
    loading: false,
  }),
}))

vi.mock('../../../components/guards/PermissionGuard', () => ({
  default: ({ children }) => <>{children}</>,
}))

describe('UjianForm active semester auto-selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mapelService.getMapel.mockResolvedValue({ data: { data: [] } })
    kelasService.getAll.mockResolvedValue({ data: { data: [] } })
    semesterService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 10, nama: 'Semester Ganjil 2024/2025', is_active: false },
          { id: 11, nama: 'Semester Genap 2024/2025', is_active: true },
        ],
      },
    })
  })

  it('automatically pre-selects active semester on create mode', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/akademik/ujian/create']}>
        <Routes>
          <Route path="/akademik/ujian/create" element={<UjianForm />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const select = container.querySelector('select[name="semester_id"]')
      expect(select.value).toBe('11')
    })

    expect(screen.getByText('Semester Genap 2024/2025 (Aktif)')).toBeDefined()
  })

  it('keeps existing semester on edit mode', async () => {
    ujianService.getById.mockResolvedValue({
      data: {
        data: {
          id: 5,
          mst_mapel_id: 1,
          mst_kelas_id: 2,
          jenis: '1',
          nama: 'UTS Kimia',
          tanggal: '2025-05-10',
          semester_id: 10,
        },
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/akademik/ujian/5/edit']}>
        <Routes>
          <Route path="/akademik/ujian/:id/edit" element={<UjianForm />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const select = container.querySelector('select[name="semester_id"]')
      expect(select.value).toBe('10')
    })
  })
})
