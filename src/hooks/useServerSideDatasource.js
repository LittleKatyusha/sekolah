import { useCallback, useMemo } from 'react'
import { apiService } from '../utils/api'

/**
 * Creates a server-side datasource for AG Grid Server-side Row Model
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - API endpoint (e.g., '/siswa/')
 * @param {Function} [options.transformData] - Optional function to transform API response
 * @param {Object} [options.staticParams] - Static parameters to include in every request
 * @returns {Object} AG Grid datasource object with getRows function
 */
export const useServerSideDatasource = ({ endpoint, transformData, staticParams = {} }) => {
  const getRows = useCallback(async (params) => {
    const { startRow, endRow, sortModel, filterModel } = params
    
    // Build query parameters
    const queryParams = {
      ...staticParams,
      per_page: endRow - startRow,
      page: Math.floor(startRow / (endRow - startRow)) + 1,
    }

    // Add sorting
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0]
      queryParams.sort_by = sort.colId
      queryParams.sort_dir = sort.sort === 'asc' ? 'asc' : 'desc'
    }

    // Add filtering
    if (filterModel) {
      Object.keys(filterModel).forEach((key) => {
        const filter = filterModel[key]
        if (filter.filter !== undefined) {
          if (filter.type === 'contains') {
            queryParams[key] = filter.filter
          } else if (filter.type === 'equals') {
            queryParams[`${key}_eq`] = filter.filter
          } else if (filter.type === 'startsWith') {
            queryParams[`${key}_starts_with`] = filter.filter
          } else if (filter.type === 'endsWith') {
            queryParams[`${key}_ends_with`] = filter.filter
          } else if (filter.type === 'greaterThan') {
            queryParams[`${key}_gt`] = filter.filter
          } else if (filter.type === 'lessThan') {
            queryParams[`${key}_lt`] = filter.filter
          } else {
            // Default to contains for text filters
            queryParams[key] = filter.filter
          }
        }
      })
    }

    try {
      const { data, error } = await apiService.get(endpoint, { params: queryParams })
      
      if (error) {
        console.error('Error fetching data:', error)
        params.failCallback()
        return
      }

      // Transform data if transformer is provided
      let rows = data.data || []
      if (transformData) {
        rows = transformData(rows)
      }

      // Get total count from meta
      const totalCount = data.meta?.total || data.total || rows.length

      // AG Grid expects: successCallback(rows, lastRow)
      // lastRow is the total row count if known, otherwise -1
      params.successCallback(rows, totalCount)
    } catch (error) {
      console.error('Exception fetching data:', error)
      params.failCallback()
    }
  }, [endpoint, transformData, staticParams])

  return useMemo(() => ({
    getRows
  }), [getRows])
}

export default useServerSideDatasource