# AG Grid Server-side Row Model Implementation

This document describes the implementation of AG Grid Server-side Row Model support in this project.

## Overview

The project now supports two approaches for server-side data loading in AG Grid:

1. **Infinite Row Model** (Community Edition) - Available now
2. **Server-side Row Model** (Enterprise Edition) - Requires `ag-grid-enterprise` package

## Installation

### For Infinite Row Model (Community Edition)
No additional installation required. Already using `ag-grid-community` and `ag-grid-react`.

### For Server-side Row Model (Enterprise Edition)
```bash
npm install ag-grid-enterprise
```

Then import it in your main entry file:
```javascript
import 'ag-grid-enterprise'
```

## Usage

### Option 1: InfiniteGrid (Community Edition - Recommended)

Use the `InfiniteGrid` component for server-side pagination, sorting, and filtering:

```jsx
import InfiniteGrid from '@/components/ui/InfiniteGrid'

const MyPage = () => {
  const columnDefs = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name', filter: 'agTextColumnFilter', sortable: true },
    // ... more columns
  ]

  return (
    <InfiniteGrid
      endpoint="/api/data/"
      columnDefs={columnDefs}
      cacheBlockSize={20}
      paginationPageSize={20}
      height={600}
    />
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endpoint` | string | required | API endpoint for fetching data |
| `columnDefs` | array | required | Column definitions |
| `defaultColDef` | object | `{ resizable: true, sortable: true, filter: true }` | Default column settings |
| `transformData` | function | undefined | Optional function to transform API response |
| `staticParams` | object | `{}` | Static parameters to include in every request |
| `cacheBlockSize` | number | 100 | Number of rows per block |
| `pagination` | boolean | true | Enable pagination |
| `paginationPageSize` | number | 20 | Default page size |
| `paginationPageSizeSelector` | array | `[10, 20, 50, 100]` | Page size options |
| `animateRows` | boolean | true | Enable row animation |
| `themeClass` | string | `'ag-theme-alpine dark:ag-theme-alpine-dark'` | Theme class |
| `height` | number | 600 | Grid height |
| `onGridReady` | function | undefined | Callback when grid is ready |
| `onRowClicked` | function | undefined | Callback when row is clicked |
| `rowSelection` | boolean | false | Enable row selection |

#### Ref Methods

```jsx
const gridRef = useRef(null)

// Refresh the grid cache
gridRef.current.refreshGrid()
```

### Option 2: ServerGrid (Enterprise Edition)

Use the `ServerGrid` component for full Server-side Row Model with row grouping and master/detail:

```jsx
import ServerGrid from '@/components/ui/ServerGrid'

const MyPage = () => {
  return (
    <ServerGrid
      endpoint="/api/data/"
      columnDefs={columnDefs}
      // Enterprise features
      rowModelType="serverSide"
      serverSideStoreType="partial"
    />
  )
}
```

## API Response Format

The grid expects the API to return data in this format:

```json
{
  "data": [
    { "id": 1, "name": "John", "email": "john@example.com" },
    { "id": 2, "name": "Jane", "email": "jane@example.com" }
  ],
  "meta": {
    "total": 100,
    "current_page": 1,
    "per_page": 20
  }
}
```

Or alternatively:

```json
{
  "data": [...],
  "total": 100
}
```

## Filter Mapping

The grid automatically converts AG Grid filter types to API parameters:

| AG Grid Filter Type | API Parameter |
|---------------------|---------------|
| `contains` | `field=value` |
| `equals` | `field_eq=value` |
| `notEqual` | `field_ne=value` |
| `startsWith` | `field_starts_with=value` |
| `endsWith` | `field_ends_with=value` |
| `greaterThan` | `field_gt=value` |
| `greaterThanOrEqual` | `field_gte=value` |
| `lessThan` | `field_lt=value` |
| `lessThanOrEqual` | `field_lte=value` |
| `inRange` | `field_min=value&field_max=value` |

## Sorting

Sorting is passed to the API as:
- `sort_by`: Column field name
- `sort_dir`: `asc` or `desc`

## Example: SiswaList

See [`src/features/siswa/pages/SiswaList.jsx`](../../features/siswa/pages/SiswaList.jsx) for a complete example.

## Hook: useServerSideDatasource

For more control, you can use the `useServerSideDatasource` hook:

```jsx
import { useServerSideDatasource } from '@/hooks/useServerSideDatasource'

const MyGrid = ({ columnDefs }) => {
  const datasource = useServerSideDatasource({
    endpoint: '/api/data/',
    transformData: (data) => data.map(item => ({ ...item, fullName: `${item.firstName} ${item.lastName}` })),
    staticParams: { status: 'active' }
  })

  return (
    <AgGridReact
      columnDefs={columnDefs}
      rowModelType="infinite"
      datasource={datasource}
    />
  )
}
```

## Differences: Infinite vs Server-side Row Model

| Feature | Infinite Row Model | Server-side Row Model |
|---------|-------------------|----------------------|
| Package | Community | Enterprise |
| Row Grouping | ❌ | ✅ |
| Master/Detail | ❌ | ✅ |
| Row Spanning | ❌ | ✅ |
| Clipboard | ✅ | ✅ |
| Export | ✅ | ✅ |
| Pagination | ✅ | ✅ |
| Sorting | ✅ | ✅ |
| Filtering | ✅ | ✅ |
| Lazy Loading | ✅ | ✅ |

## Troubleshooting

### Data not loading
- Check browser console for errors
- Verify API endpoint returns correct format
- Ensure `per_page` and `page` parameters are supported by your API

### Infinite scroll not working
- Ensure `cacheBlockSize` is set appropriately
- Check that `rowModelType="infinite"` is set

### Filtering not working
- Verify API supports the filter parameters
- Check filter model conversion in datasource

## Migration from Client-side

To migrate an existing client-side grid to server-side:

1. Replace `AgGridReact` with `InfiniteGrid`
2. Remove manual pagination state (`pageSize`, `currentPage`, etc.)
3. Remove manual data fetching (`useEffect` for loading data)
4. Remove `onPaginationChanged` handler
5. Update `columnDefs` to use `filter: 'agTextColumnFilter'` instead of `filter: true`
6. Use `valueGetter` for nested data (e.g., `params.data.kelas.nama_kelas`)