import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import PembayaranSppBatchModal from "./PembayaranSppBatchModal"
import { pembayaranSppService, tarifSppService } from "../services/sppService"
import { siswaService } from "../../siswa/services/siswaService"
import { showError, showSuccess } from "../../../utils/sweetalert"

vi.mock("../services/sppService", () => ({
  tarifSppService: {
    getAll: vi.fn(),
  },
  pembayaranSppService: {
    batchBayar: vi.fn(),
  },
}))

vi.mock("../../siswa/services/siswaService", () => ({
  siswaService: {
    getAll: vi.fn(),
  },
}))

vi.mock("../../../utils/sweetalert", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

describe("PembayaranSppBatchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tarifSppService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 10, nominal: 300000, kelas: { nama_kelas: "X MIPA 1" }, mst_kelas_id: 1 },
          { id: 11, nominal: 350000, kelas: { nama_kelas: "XI MIPA 1" }, mst_kelas_id: 2 },
        ],
      },
    })
    siswaService.getAll.mockResolvedValue({
      data: {
        data: [
          { id: 101, nama: "Budi Santoso", nis: "1001", kelas: { nama_kelas: "X MIPA 1" }, mst_kelas_id: 1 },
        ],
      },
    })
  })

  it("does not render when isOpen is false", () => {
    render(<PembayaranSppBatchModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(screen.queryByText("Kasir Pembayaran SPP Kolektif")).toBeNull()
  })

  it("renders modal header, initial row, and tarif options when open", async () => {
    render(<PembayaranSppBatchModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />)

    expect(screen.getByText("Kasir Pembayaran SPP Kolektif")).toBeDefined()
    expect(screen.getByText("Data Pembayaran Siswa")).toBeDefined()

    await waitFor(() => {
      expect(tarifSppService.getAll).toHaveBeenCalled()
      expect(screen.getByText(/X MIPA 1/)).toBeDefined()
    })
  })

  it("adds and removes student rows", async () => {
    render(<PembayaranSppBatchModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />)

    const addButton = screen.getByText("Tambah Siswa Lain")
    fireEvent.click(addButton)

    await waitFor(() => {
      const rows = screen.getAllByText("Data Pembayaran Siswa")
      expect(rows.length).toBe(2)
    })

    const deleteButtons = screen.getAllByTitle("Hapus baris")
    expect(deleteButtons.length).toBe(2)
    fireEvent.click(deleteButtons[1])

    await waitFor(() => {
      const rows = screen.getAllByText("Data Pembayaran Siswa")
      expect(rows.length).toBe(1)
    })
  })

  it("allows selecting months and updates subtotal and total", async () => {
    render(<PembayaranSppBatchModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/X MIPA 1/)).toBeDefined()
    })

    // Select tarif
    const tarifSelect = screen.getByLabelText("Pilih Tarif SPP")
    fireEvent.change(tarifSelect, { target: { value: "10" } })

    // Select month Jan (1) and Feb (2)
    const janButton = screen.getByRole("button", { name: "Jan" })
    const febButton = screen.getByRole("button", { name: "Feb" })
    fireEvent.click(janButton)
    fireEvent.click(febButton)

    await waitFor(() => {
      expect(screen.getByText("2 Bulan")).toBeDefined()
    })
  })

  it("submits batch payload and displays single receipt view on success", async () => {
    const onSuccess = vi.fn()
    pembayaranSppService.batchBayar.mockResolvedValueOnce({
      data: {
        data: {
          total_transaksi: 2,
          total_nominal: 600000,
          receipt: {
            nomor_kwitansi: "KW-SPP-20261024-TEST99",
            tanggal: "2026-10-24T10:00:00Z",
            petugas_id: 1,
            total_nominal: 600000,
            total_item: 2,
            items: [
              { pembayaran_id: 1, siswa_id: 101, siswa_nama: "Budi Santoso", bulan: 1, tahun: 2026, nominal: 300000 },
              { pembayaran_id: 2, siswa_id: 101, siswa_nama: "Budi Santoso", bulan: 2, tahun: 2026, nominal: 300000 },
            ],
          },
        },
      },
      error: null,
    })

    render(<PembayaranSppBatchModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText(/X MIPA 1/)).toBeDefined()
    })

    // Open SearchableSelect trigger
    const trigger = screen.getByText("Cari siswa (Nama/NIS)...")
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(siswaService.getAll).toHaveBeenCalled()
    })

    // Click student option
    const studentOption = screen.getByText(/Budi Santoso/)
    fireEvent.click(studentOption)

    // Select tarif
    const tarifSelect = screen.getByLabelText("Pilih Tarif SPP")
    fireEvent.change(tarifSelect, { target: { value: "10" } })

    // Select month Jan
    const janButton = screen.getByRole("button", { name: "Jan" })
    fireEvent.click(janButton)

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Bayar/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(pembayaranSppService.batchBayar).toHaveBeenCalledWith({
        items: [
          expect.objectContaining({
            mst_siswa_id: 101,
            mst_tarif_spp_id: 10,
            bulan: [1],
            tahun: 2026,
            metode_pembayaran: 1,
          }),
        ],
      })
      // Should show single receipt view
      expect(screen.getByText("BUKTI PEMBAYARAN SPP")).toBeDefined()
      expect(screen.getByText("KW-SPP-20261024-TEST99")).toBeDefined()
      expect(screen.getByText("Cetak Kwitansi")).toBeDefined()
    })
  })
})
