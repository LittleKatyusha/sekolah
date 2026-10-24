import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import KenaikanKelasPage from "./KenaikanKelasPage"
import { kelasService } from "../../kelas/services/kelasService"
import { siswaService } from "../services/siswaService"
import * as sweetalert from "../../../utils/sweetalert"

vi.mock("../../kelas/services/kelasService", () => ({
  kelasService: {
    getAll: vi.fn(),
  },
}))

vi.mock("../services/siswaService", () => ({
  siswaService: {
    getByKelas: vi.fn(),
    batchPromote: vi.fn(),
  },
}))

vi.mock("../../../utils/sweetalert", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showConfirm: vi.fn(),
}))

const mockClasses = [
  { id: 1, nama_kelas: "X MIPA 1", tingkat: 10, kapasitas: 30, jumlah_siswa: 25 },
  { id: 2, nama_kelas: "XI MIPA 1", tingkat: 11, kapasitas: 28, jumlah_siswa: 26 },
]

const mockStudents = [
  { id: 101, nis: "1001", nama: "Ahmad Dahlan", jenis_kelamin: "L", mst_kelas_id: 1 },
  { id: 102, nis: "1002", nama: "Budi Santoso", jenis_kelamin: "L", mst_kelas_id: 1 },
  { id: 103, nis: "1003", nama: "Citra Dewi", jenis_kelamin: "P", mst_kelas_id: 1 },
]

describe("KenaikanKelasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    kelasService.getAll.mockResolvedValue({ data: { data: mockClasses } })
    siswaService.getByKelas.mockResolvedValue({ data: mockStudents })
    sweetalert.showConfirm.mockResolvedValue({ isConfirmed: true })
    siswaService.batchPromote.mockResolvedValue({ data: { updated_count: 2 } })
  })

  it("renders page header and panels correctly", async () => {
    render(
      <MemoryRouter>
        <KenaikanKelasPage />
      </MemoryRouter>
    )

    expect(screen.getByText("Kenaikan Kelas & Mutasi Rombel Massal")).toBeInTheDocument()
    expect(screen.getByText("1. Kelas Asal")).toBeInTheDocument()
    expect(screen.getByText("2. Aksi")).toBeInTheDocument()

    await waitFor(() => {
      expect(kelasService.getAll).toHaveBeenCalled()
    })
  })

  it("loads students when a source class is selected", async () => {
    render(
      <MemoryRouter>
        <KenaikanKelasPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/X MIPA 1/)[0]).toBeInTheDocument()
    })

    const sourceSelect = screen.getByLabelText("Pilih Kelas Asal")
    fireEvent.change(sourceSelect, { target: { value: "1" } })

    await waitFor(() => {
      expect(siswaService.getByKelas).toHaveBeenCalledWith("1")
      expect(screen.getByText("Ahmad Dahlan")).toBeInTheDocument()
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument()
      expect(screen.getByText("Citra Dewi")).toBeInTheDocument()
    })
  })

  it("toggles student selection and select all", async () => {
    render(
      <MemoryRouter>
        <KenaikanKelasPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/X MIPA 1/)[0]).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText("Pilih Kelas Asal"), { target: { value: "1" } })

    await waitFor(() => {
      expect(screen.getByText("Ahmad Dahlan")).toBeInTheDocument()
    })

    // Click select all
    const selectAllCheckbox = screen.getByLabelText("Pilih Semua Siswa")
    fireEvent.click(selectAllCheckbox)

    expect(screen.getByText("3 dari 3 terpilih")).toBeInTheDocument()

    // Uncheck one
    const ahmadCheckbox = screen.getByLabelText("Pilih Ahmad Dahlan")
    fireEvent.click(ahmadCheckbox)

    expect(screen.getByText("2 dari 3 terpilih")).toBeInTheDocument()
  })

  it("calculates capacity and submits promotion successfully", async () => {
    render(
      <MemoryRouter>
        <KenaikanKelasPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/X MIPA 1/)[0]).toBeInTheDocument()
    })

    // Select source class
    fireEvent.change(screen.getByLabelText("Pilih Kelas Asal"), { target: { value: "1" } })

    await waitFor(() => {
      expect(screen.getByText("Ahmad Dahlan")).toBeInTheDocument()
    })

    // Select target class
    const targetSelect = screen.getByLabelText("Pilih Kelas Tujuan")
    fireEvent.change(targetSelect, { target: { value: "2" } })

    // Select one student
    fireEvent.click(screen.getByLabelText("Pilih Ahmad Dahlan"))

    // Capacity indicator: currently 26 + 1 = 27 / 28
    await waitFor(() => {
      expect(screen.getByText(/27 \/ 28 Siswa/)).toBeInTheDocument()
    })

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Pindahkan Terpilih/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(sweetalert.showConfirm).toHaveBeenCalled()
      expect(siswaService.batchPromote).toHaveBeenCalledWith({
        action: "promote",
        from_mst_kelas_id: 1,
        to_mst_kelas_id: 2,
        siswa_ids: [101],
      })
      expect(sweetalert.showSuccess).toHaveBeenCalled()
    })
  })

  it("submits graduation when action is lulus", async () => {
    render(
      <MemoryRouter>
        <KenaikanKelasPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/X MIPA 1/)[0]).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText("Pilih Kelas Asal"), { target: { value: "1" } })

    await waitFor(() => {
      expect(screen.getByText("Ahmad Dahlan")).toBeInTheDocument()
    })

    // Toggle action to lulus
    fireEvent.click(screen.getByRole("button", { name: /Luluskan Siswa/i }))

    expect(screen.getByText("3. Kelulusan Siswa")).toBeInTheDocument()

    // Select one student
    fireEvent.click(screen.getByLabelText("Pilih Ahmad Dahlan"))

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Luluskan Terpilih/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(sweetalert.showConfirm).toHaveBeenCalled()
      expect(siswaService.batchPromote).toHaveBeenCalledWith({
        action: "lulus",
        from_mst_kelas_id: 1,
        to_mst_kelas_id: undefined,
        siswa_ids: [101],
      })
      expect(sweetalert.showSuccess).toHaveBeenCalled()
    })
  })
})
