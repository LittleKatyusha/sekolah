import { useCallback, useMemo } from 'react'
import { apiService } from '../utils/api'
import {
  buildAgGridRequestParams,
  buildLegacyRequestParams,
  extractGridRows,
  handleGridFailure,
  handleGridSuccess,
  normalizeColumnDefsForQuery,
} from '../components/ui/agGridQuery'

/**
 * Creates a server-side datasource for AG Grid Server-side Row Model
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - API endpoint (e.g., '/siswa/')
 * @param {Function} [options.transformData] - Optional function to transform API response
 * @param {Object} [options.staticParams] - Static parameters to include in every request
 * @returns {Object} AG Grid datasource object with getRows function
 */
export const useServerSideDatasource = ({ endpoint, transformData, staticParams = {}, requestMode = 'ag-grid', columnDefs = [] }) => {
  const normalizedColumnDefs = useMemo(
    () => normalizeColumnDefsForQuery(columnDefs),
    [columnDefs]
  )

  const getRows = useCallback(async (params) => {
    const { startRow, endRow, sortModel, filterModel } = params
    const queryParams = requestMode === 'ag-grid'
      ? buildAgGridRequestParams({
          startRow,
          endRow,
          sortModel,
          filterModel,
          staticParams,
          columnDefs: normalizedColumnDefs,
        })
      : buildLegacyRequestParams({
          startRow,
          endRow,
          sortModel,
          filterModel,
          staticParams,
        })

    try {
      const { data, error } = await apiService.get(endpoint, { params: queryParams })
      
      if (error) {
        console.error('Error fetching data:', error)
        handleGridFailure(params)
        return
      }

      const { rows, totalCount } = extractGridRows(data, transformData)
      handleGridSuccess(params, rows, totalCount)
    } catch (error) {
      console.error('Exception fetching data:', error)
      handleGridFailure(params)
    }
  }, [endpoint, normalizedColumnDefs, requestMode, transformData, staticParams])

  return useMemo(() => ({
    getRows
  }), [getRows])
}

export default useServerSideDatasource