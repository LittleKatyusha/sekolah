import { useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

/**
 * ServerGrid - A reusable AG Grid component with Server-side Row Model support
 * 
 * @param {Object} props - Component props
 * @param {string} props.endpoint - API endpoint for fetching data
 * @param {Array} props.columnDefs - Column definitions for AG Grid
 * @param {Object} [props.defaultColDef] - Default column definition
 * @param {Function} [props.transformData] - Optional function to transform API response
 * @param {Object} [props.staticParams] - Static parameters to include in every request
 * @param {number} [props.cacheBlockSize=100] - Number of rows per block (default: 100)
 * @param {number} [props.maxBlocksInCache=10] - Maximum blocks in cache (default: 10)
 * @param {boolean} [props.pagination=true] - Enable pagination (default: true)
 * @param {number} [props.paginationPageSize=20] - Default page size (default: 20)
 * @param {Array} [props.paginationPageSizeSelector=[10, 20, 50, 100]] - Page size options
 * @param {boolean} [props.animateRows=true] - Enable row animation (default: true)
 * @param {string} [props.themeClass='ag-theme-alpine dark:ag-theme-alpine-dark'] - Theme class
 * @param {number} [props.height=600] - Grid height (default: 600)
 * @param {Function} [props.onGridReady] - Callback when grid is ready
 * @param {Object} [props.restProps] - Additional props passed to AgGridReact
 */
const ServerGrid = ({
  endpoint,
  columnDefs,
  defaultColDef = {},
  transformData,
  staticParams = {},
  cacheBlockSize = 100,
  maxBlocksInCache = 10,
  pagination = true,
  paginationPageSize = 20,
  paginationPageSizeSelector = [10, 20, 50, 100],
  animateRows = true,
  themeClass = 'ag-theme-alpine dark:ag-theme-alpine-dark',
  height = 600,
  onGridReady,
  ...restProps
}) => {
  // Create the server-side datasource
  const dataSource = useMemo(() => ({
    getRows: async (params) => {
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

      // Add filtering - convert AG Grid filter model to API params
      if (filterModel && Object.keys(filterModel).length > 0) {
        Object.entries(filterModel).forEach(([key, filter]) => {
          if (filter.filter !== undefined && filter.filter !== '') {
            switch (filter.type) {
              case 'contains':
                queryParams[key] = filter.filter
                break
              case 'equals':
                queryParams[`${key}_eq`] = filter.filter
                break
              case 'notEqual':
                queryParams[`${key}_ne`] = filter.filter
                break
              case 'startsWith':
                queryParams[`${key}_starts_with`] = filter.filter
                break
              case 'endsWith':
                queryParams[`${key}_ends_with`] = filter.filter
                break
              case 'greaterThan':
                queryParams[`${key}_gt`] = filter.filter
                break
              case 'greaterThanOrEqual':
                queryParams[`${key}_gte`] = filter.filter
                break
              case 'lessThan':
                queryParams[`${key}_lt`] = filter.filter
                break
              case 'lessThanOrEqual':
                queryParams[`${key}_lte`] = filter.filter
                break
              case 'inRange':
                queryParams[`${key}_min`] = filter.filter
                queryParams[`${key}_max`] = filter.filterTo
                break
              default:
                queryParams[key] = filter.filter
            }
          }
        })
      }

      try {
        // Use dynamic import to avoid issues if ag-grid-enterprise is not installed
        const { apiService } = await import('../utils/api')
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
    }
  }), [endpoint, transformData, staticParams])

  // Default column definition
  const mergedDefaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    ...defaultColDef
  }), [defaultColDef])

  // Handle grid ready
  const handleGridReady = useCallback((params) => {
    // Set the datasource on the grid
    params.api.setGridOption('serverSideDatasource', dataSource)
    
    if (onGridReady) {
      onGridReady(params)
    }
  }, [dataSource, onGridReady])

  return (
    <div className={themeClass} style={{ height }}>
      <AgGridReact
        columnDefs={columnDefs}
        defaultColDef={mergedDefaultColDef}
        rowModelType="serverSide"
        cacheBlockSize={cacheBlockSize}
        maxBlocksInCache={maxBlocksInCache}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        animateRows={animateRows}
        onGridReady={handleGridReady}
        // Server-side specific options
        serverSideStoreType="partial"
        suppressRowClickSelection={true}
        rowSelection="multiple"
        // Use legacy theme to avoid conflict with CSS imports
        theme="legacy"
        {...restProps}
      />
    </div>
  )
}

export default ServerGrid