import { useMemo, useCallback, useRef, useEffect } from 'react'
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

const EMPTY_STATIC_PARAMS = Object.freeze({})

const normalizeStaticParams = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeStaticParams)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = normalizeStaticParams(value[key])
        return accumulator
      }, {})
  }

  return value
}

/**
 * InfiniteGrid - A reusable AG Grid component with Infinite Row Model support
 *
 * This uses AG Grid's Infinite Row Model which is available in the Community version.
 * It provides server-side pagination, sorting, and filtering capabilities.
 *
 * @param {Object} props - Component props
 * @param {string} props.endpoint - API endpoint for fetching data
 * @param {Array} props.columnDefs - Column definitions for AG Grid
 * @param {Object} [props.defaultColDef] - Default column definition
 * @param {Function} [props.transformData] - Optional function to transform API response
 * @param {Object} [props.staticParams] - Static parameters to include in every request.
 * Prefer passing a memoized object from callers; this component also stabilizes
 * equivalent object values internally to avoid unnecessary datasource resets.
 * @param {number} [props.cacheBlockSize=100] - Number of rows per block (default: 100)
 * @param {boolean} [props.pagination=true] - Enable pagination (default: true)
 * @param {number} [props.paginationPageSize=20] - Default page size (default: 20)
 * @param {Array} [props.paginationPageSizeSelector=[10, 20, 50, 100]] - Page size options
 * @param {boolean} [props.animateRows=true] - Enable row animation (default: true)
 * @param {string} [props.themeClass='ag-theme-alpine dark:ag-theme-alpine-dark'] - Theme class
 * @param {number} [props.height=600] - Grid height (default: 600)
 * @param {Function} [props.onGridReady] - Callback when grid is ready
 * @param {Function} [props.onRowClicked] - Callback when row is clicked
 * @param {Function} [props.onSelectionChanged] - Callback when selection changes
 * @param {boolean} [props.rowSelection=false] - Enable row selection
 * @param {Object} [props.restProps] - Additional props passed to AgGridReact
 */
const InfiniteGrid = ({
  endpoint,
  columnDefs,
  defaultColDef = {},
  transformData,
  staticParams = EMPTY_STATIC_PARAMS,
  cacheBlockSize = 100,
  pagination = true,
  paginationPageSize = 20,
  paginationPageSizeSelector = [10, 20, 50, 100],
  animateRows = true,
  themeClass = 'ag-theme-alpine dark:ag-theme-alpine-dark',
  height = 600,
  onGridReady,
  onRowClicked,
  onSelectionChanged,
  rowSelection = false,
  requestMode = 'ag-grid',
  ...restProps
}) => {
  const gridRef = useRef(null)

  const staticParamsKey = useMemo(
    () => JSON.stringify(normalizeStaticParams(staticParams ?? EMPTY_STATIC_PARAMS)),
    [staticParams]
  )

  const stabilizedStaticParams = useMemo(
    () => JSON.parse(staticParamsKey),
    [staticParamsKey]
  )

  const normalizedColumnDefs = useMemo(
    () => normalizeColumnDefsForQuery(columnDefs),
    [columnDefs]
  )

  // Create the infinite row model datasource
  const dataSource = useMemo(() => ({
    getRows: async (params) => {
      const { startRow, endRow, sortModel, filterModel } = params
      const queryParams = requestMode === 'ag-grid'
        ? buildAgGridRequestParams({
            startRow,
            endRow,
            sortModel,
            filterModel,
            staticParams: stabilizedStaticParams,
            columnDefs: normalizedColumnDefs,
          })
        : buildLegacyRequestParams({
            startRow,
            endRow,
            sortModel,
            filterModel,
            staticParams: stabilizedStaticParams,
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
  }), [endpoint, normalizedColumnDefs, requestMode, transformData, stabilizedStaticParams])

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
    params.api.setGridOption('datasource', dataSource)
    
    if (onGridReady) {
      onGridReady(params)
    }
  }, [dataSource, onGridReady])

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption('datasource', dataSource)
    }
  }, [dataSource])

  // Handle refresh - can be called externally to refresh the grid
  const refreshGrid = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  // Expose refresh method via ref
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.refreshGrid = refreshGrid
    }
  }, [refreshGrid])

  return (
    <div className={themeClass} style={{ height }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={normalizedColumnDefs}
        defaultColDef={mergedDefaultColDef}
        rowModelType="infinite"
        cacheBlockSize={cacheBlockSize}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        animateRows={animateRows}
        onGridReady={handleGridReady}
        onRowClicked={onRowClicked}
        onSelectionChanged={onSelectionChanged}
        rowSelection={rowSelection ? { mode: 'multiRow', enableClickSelection: false } : undefined}
        // Infinite row model specific
        maxBlocksInCache={10}
        blockLoadDebounceMillis={200}
        {...restProps}
      />
    </div>
  )
}

// Add refreshGrid method to the component
InfiniteGrid.displayName = 'InfiniteGrid'

export default InfiniteGrid