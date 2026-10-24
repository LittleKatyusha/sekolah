import * as XLSX from 'xlsx'

/**
 * Export selected rows from AG-Grid / table to an Excel file (.xlsx)
 * @param {Array<Object>} rows - Array of row objects to export
 * @param {Array<Object>} columns - AG-Grid column definitions
 * @param {string} filename - Target filename (default: 'export-data.xlsx')
 * @param {string} sheetName - Sheet name (default: 'Data')
 */
export const exportSelectedRowsToExcel = (
  rows = [],
  columns = [],
  filename = 'export-data.xlsx',
  sheetName = 'Data'
) => {
  if (!rows || rows.length === 0) return

  // Filter out columns without field/headerName, or checkbox/actions columns
  const validCols = columns.filter((col) => {
    if (col.checkboxSelection) return false
    if (!col.headerName) return false
    if (col.headerName.toLowerCase() === 'aksi' || col.headerName.toLowerCase() === 'action') return false
    return Boolean(col.field || col.valueGetter)
  })

  const headers = validCols.map((c) => c.headerName)

  const dataRows = rows.map((row) => {
    return validCols.map((col) => {
      if (typeof col.valueGetter === 'function') {
        const val = col.valueGetter({ data: row })
        return val != null ? val : ''
      }
      const val = col.field ? row[col.field] : ''
      return val != null ? val : ''
    })
  })

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows])

  // Set column widths based on header length and content
  worksheet['!cols'] = validCols.map((col, idx) => {
    let maxLen = (col.headerName || '').length
    for (const r of dataRows) {
      const cellVal = String(r[idx] ?? '')
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, safeFilename)
}
