import { describe, expect, it, vi } from 'vitest'
import { exportSelectedRowsToExcel } from './excelExport'
import * as XLSX from 'xlsx'

vi.mock('xlsx', () => {
  const aoa_to_sheet = vi.fn().mockReturnValue({})
  const book_new = vi.fn().mockReturnValue({})
  const book_append_sheet = vi.fn()
  const writeFile = vi.fn()
  return {
    utils: {
      aoa_to_sheet,
      book_new,
      book_append_sheet,
    },
    writeFile,
  }
})

describe('exportSelectedRowsToExcel', () => {
  it('returns early when rows array is empty', () => {
    exportSelectedRowsToExcel([], [{ field: 'name', headerName: 'Name' }])
    expect(XLSX.utils.book_new).not.toHaveBeenCalled()
  })

  it('filters out action and checkbox columns and writes workbook', () => {
    const columns = [
      { checkboxSelection: true },
      { field: 'id', headerName: 'ID' },
      { field: 'nama', headerName: 'Nama Siswa' },
      { headerName: 'Aksi' },
    ]

    const rows = [
      { id: 1, nama: 'Budi' },
      { id: 2, nama: 'Siti' },
    ]

    exportSelectedRowsToExcel(rows, columns, 'siswa-test.xlsx', 'Siswa')

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['ID', 'Nama Siswa'],
      [1, 'Budi'],
      [2, 'Siti'],
    ])
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'siswa-test.xlsx')
  })
})
