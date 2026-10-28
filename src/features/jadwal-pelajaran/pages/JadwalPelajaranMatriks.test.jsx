import React from "react"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import JadwalPelajaranMatriks from "./JadwalPelajaranMatriks"
import { jadwalPelajaranService } from "../services/jadwalPelajaranService"
import { kelasService } from "../../kelas/services/kelasService"
import { guruMapelService } from "../../guru-mapel/services/guruMapelService"
import { hariOperasionalService } from "../../hari-operasional/services/hariOperasionalService"
import * as sweetalert from "../../../utils/sweetalert"

vi.mock("../services/jadwalPelajaranService", () => ({
  jadwalPelajaranService: {
    getByKelas: vi.fn(),
    batchStore: vi.fn(),
  },
}))

vi.mock("../../kelas/services/kelasService", () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock("../../guru-mapel/services/guruMapelService", () => ({
  guruMapelService: {
    getGuruMapel: vi.fn(),
  },
}))

vi.mock("../../hari-operasional/services/hariOperasionalService", () => ({
  hariOperasionalService: {
    getAll: vi.fn(),
  },
}))

vi.mock("../../../utils/sweetalert", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showConfirm: vi.fn(),
}))

const mockClasses = [
  { id: 1, nama_kelas: "X-A", tingkat: 10 },
  { id: 2, nama_kelas: "XI-B", tingkat: 11 },
]

const mockGuruMapel = [
  { id: 14, guru: { nama: "Budi Santoso" }, mapel: { nama_mapel: "Matematika" } },
  { id: 20, guru: { nama: "Dewi Lestari" }, mapel: { nama_mapel: "Fisika" } },
]

const mockExistingSchedule = [
  {
    id: 1,
    mst_kelas_id: 1,
    mst_guru_mapel_id: 14,
    hari: "MON",
    jam_mulai: "07:00",
    jam_selesai: "07:45",
    ruangan: "R-101",
  },
]

describe("JadwalPelajaranMatriks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kelasService.getAll.mockResolvedValue({ data: { data: mockClasses } })
    guruMapelService.getGuruMapel.mockResolvedValue({ data: { data: mockGuruMapel } })
    hariOperasionalService.getAll.mockResolvedValue({
      data: {
        data: [
          { hari: "MON", is_active: true },
          { hari: "TUE", is_active: true },
          { hari: "WED", is_active: true },
          { hari: "THU", is_active: true },
          { hari: "FRI", is_active: true },
          { hari: "SAT", is_active: true },
        ],
      },
    })
    jadwalPelajaranService.getByKelas.mockResolvedValue({ data: { data: mockExistingSchedule } })
    sweetalert.showConfirm.mockResolvedValue(true)
    jadwalPelajaranService.batchStore.mockResolvedValue({ data: { message: "Berhasil", data: { saved_count: 1 } } })
  })

  it("renders header and loads initial class schedules", async () => {
    render(
      <MemoryRouter>
        <JadwalPelajaranMatriks />
      </MemoryRouter>
    )

    expect(screen.getByText("Matriks Jadwal Pelajaran Mingguan")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Pilih guru mapel Senin Jam 1" })).toHaveValue("14")
    })
  })

  it("displays conflict alert when backend returns conflicts during check", async () => {
    jadwalPelajaranService.batchStore.mockResolvedValue({
      data: {
        data: {
          valid: false,
          conflicts: [
            {
              hari: "MON",
              jam_mulai: "07:00",
              jam_selesai: "07:45",
              message: "Bentrok Guru: Budi Santoso sudah mengajar di kelas lain",
            },
          ],
        },
      },
    })

    render(
      <MemoryRouter>
        <JadwalPelajaranMatriks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Pilih guru mapel Senin Jam 1" })).toHaveValue("14")
    })

    const checkButton = screen.getByRole("button", { name: /Cek Bentrok/i })
    fireEvent.click(checkButton)

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(screen.getAllByText(/Bentrok Guru: Budi Santoso sudah mengajar di kelas lain/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it("allows saving full schedule matrix to batch endpoint", async () => {
    render(
      <MemoryRouter>
        <JadwalPelajaranMatriks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Pilih guru mapel Senin Jam 1" })).toHaveValue("14")
    })

    const saveButton = screen.getByRole("button", { name: /Simpan Matriks/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(sweetalert.showConfirm).toHaveBeenCalled()
      expect(jadwalPelajaranService.batchStore).toHaveBeenCalledWith(
        expect.objectContaining({
          mst_kelas_id: 1,
          replace_existing: true,
          jadwal: expect.arrayContaining([
            expect.objectContaining({
              hari: "MON",
              jam_mulai: "07:00",
              jam_selesai: "07:45",
              mst_guru_mapel_id: 14,
            }),
          ]),
        })
      )
      expect(sweetalert.showSuccess).toHaveBeenCalled()
    })
  })
})
