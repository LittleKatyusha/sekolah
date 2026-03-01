import { useMemo, useCallback, useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

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
 * @param {Object} [props.staticParams] - Static parameters to include in every request
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
  staticParams = {},
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
  ...restProps
}) => {
  const gridRef = useRef(null)

  // Create the infinite row model datasource
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
        // Map field names to API sort parameters
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
        const { apiService } = await import('../../utils/api')
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
        const totalCount = data.meta?.total || data.total || -1

        // AG Grid Infinite Row Model expects: successCallback(rows, lastRow)
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
    params.api.setGridOption('datasource', dataSource)
    
    if (onGridReady) {
      onGridReady(params)
    }
  }, [dataSource, onGridReady])

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
        columnDefs={columnDefs}
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
        rowSelection={rowSelection ? 'multiple' : undefined}
        suppressRowClickSelection={!rowSelection}
        // Infinite row model specific
        maxBlocksInCache={10}
        blockLoadDebounceMillis={200}
        // Use legacy theme to avoid conflict with CSS imports
        theme="legacy"
        {...restProps}
      />
    </div>
  )
}

// Add refreshGrid method to the component
InfiniteGrid.displayName = 'InfiniteGrid'

export default InfiniteGrid