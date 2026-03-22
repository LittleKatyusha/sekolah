import { useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { apiService } from '../../utils/api'
import {
  buildAgGridRequestParams,
  buildLegacyRequestParams,
  extractGridRows,
  handleGridFailure,
  handleGridSuccess,
  normalizeColumnDefsForQuery,
} from './agGridQuery'

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
  requestMode = 'ag-grid',
  ...restProps
}) => {
  const normalizedColumnDefs = useMemo(
    () => normalizeColumnDefsForQuery(columnDefs),
    [columnDefs]
  )

  // Create the server-side datasource
  const dataSource = useMemo(() => ({
    getRows: async (params) => {
      const { startRow, endRow, sortModel, filterModel } = params
      const queryParams = requestMode === 'ag-grid'
        ? buildAgGridRequestParams({
            startRow,
            endRow,
            sortModel,
            filterModel,
            staticParams,
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
    }
  }), [endpoint, requestMode, transformData, staticParams])

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
        columnDefs={normalizedColumnDefs}
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
        rowSelection={{ mode: 'multiRow', enableClickSelection: false }}
        {...restProps}
      />
    </div>
  )
}

export default ServerGrid