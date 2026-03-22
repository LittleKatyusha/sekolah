const LEGACY_QUERY_KEYS = new Set(['sort_by', 'sort_dir', 'filter'])
const UNSAFE_RESPONSE_FIELDS = new Set(['tahun_ajaran', 'kelas', 'siswa', 'ujian', 'wali_guru', 'role'])

const FILTER_TYPES = new Set(['text', 'number', 'date', 'boolean'])

const inferFilterType = (filter) => {
  if (filter?.filterType && FILTER_TYPES.has(filter.filterType)) {
    return filter.filterType
  }

  if (filter?.values) {
    return 'text'
  }

  if (filter?.dateFrom || filter?.dateTo) {
    return 'date'
  }

  if (typeof filter?.filter === 'number') {
    return 'number'
  }

  if (typeof filter?.filter === 'boolean') {
    return 'boolean'
  }

  return 'text'
}

const createConditionNode = (colId, filter) => {
  if (!filter || (!filter.type && !filter.values)) {
    return null
  }

  if (Array.isArray(filter.values) && filter.values.length > 0) {
    const conditions = filter.values.map((value) => ({
      filterType: 'text',
      colId,
      type: 'equals',
      filter: value,
    }))

    return conditions.length === 1
      ? conditions[0]
      : {
          filterType: 'join',
          type: 'OR',
          conditions,
        }
  }

  const filterType = inferFilterType(filter)
  const node = {
    filterType,
    colId,
    type: filter.type,
  }

  if (filterType === 'date') {
    if (filter.dateFrom !== undefined) {
      node.dateFrom = filter.dateFrom
    } else if (filter.filter !== undefined) {
      node.dateFrom = filter.filter
    }

    if (filter.dateTo !== undefined) {
      node.dateTo = filter.dateTo
    } else if (filter.filterTo !== undefined) {
      node.dateTo = filter.filterTo
    }

    return node
  }

  if (filter.filter !== undefined) {
    node.filter = filter.filter
  }

  if (filter.filterTo !== undefined) {
    node.filterTo = filter.filterTo
  }

  return node
}

const buildConditionNode = (colId, filter) => {
  if (!filter || typeof filter !== 'object') {
    return null
  }

  if (filter.operator && (filter.condition1 || filter.condition2)) {
    const conditions = [filter.condition1, filter.condition2]
      .map((condition) => createConditionNode(colId, condition))
      .filter(Boolean)

    if (conditions.length === 0) {
      return null
    }

    return conditions.length === 1
      ? conditions[0]
      : {
          filterType: 'join',
          type: String(filter.operator || 'AND').toUpperCase(),
          conditions,
        }
  }

  return createConditionNode(colId, filter)
}

const sanitizeStaticParams = (staticParams = {}) => {
  return Object.entries(staticParams).reduce((accumulator, [key, value]) => {
    if (!LEGACY_QUERY_KEYS.has(key)) {
      accumulator[key] = value
    }
    return accumulator
  }, {})
}

export const normalizeColumnDefsForQuery = (columnDefs = []) => {
  return columnDefs.map((columnDef) => {
    if (Array.isArray(columnDef.children)) {
      return {
        ...columnDef,
        children: normalizeColumnDefsForQuery(columnDef.children),
      }
    }

    const hasBackendField = Boolean(columnDef.backendField)
    const normalizedField = typeof columnDef.field === 'string' ? columnDef.field : ''
    const hasUnsafeField = normalizedField.includes('.') || UNSAFE_RESPONSE_FIELDS.has(normalizedField)
    const hasDerivedColumnWithoutField = !normalizedField && !hasBackendField

    const normalizedColumnDef = {
      ...columnDef,
    }

    if (hasBackendField && !columnDef.colId) {
      normalizedColumnDef.colId = columnDef.backendField
    }

    if (!hasBackendField && (hasUnsafeField || hasDerivedColumnWithoutField)) {
      normalizedColumnDef.sortable = false
      normalizedColumnDef.filter = false
    }

    return normalizedColumnDef
  })
}

export const buildAgGridRequestParams = ({ startRow, endRow, sortModel = [], filterModel = {}, staticParams = {} }) => {
  const queryParams = {
    ...sanitizeStaticParams(staticParams),
    startRow,
    endRow,
  }

  if (Array.isArray(sortModel) && sortModel.length > 0) {
    queryParams.sortModel = sortModel.map((sort) => ({
      colId: sort.colId,
      sort: sort.sort,
    }))
  }

  if (filterModel && Object.keys(filterModel).length > 0) {
    queryParams.filterModel = filterModel

    const conditions = Object.entries(filterModel)
      .map(([colId, filter]) => buildConditionNode(colId, filter))
      .filter(Boolean)

    if (conditions.length === 1) {
      queryParams.advancedFilterModel = conditions[0]
    } else if (conditions.length > 1) {
      queryParams.advancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions,
      }
    }
  }

  return queryParams
}

export const buildLegacyRequestParams = ({ startRow, endRow, sortModel = [], filterModel = {}, staticParams = {} }) => {
  const queryParams = {
    ...staticParams,
    per_page: endRow - startRow,
    page: Math.floor(startRow / (endRow - startRow)) + 1,
  }

  if (sortModel.length > 0) {
    const sort = sortModel[0]
    queryParams.sort_by = sort.colId
    queryParams.sort_dir = sort.sort === 'asc' ? 'asc' : 'desc'
  }

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

  return queryParams
}

export const extractGridRows = (data, transformData) => {
  const rawRows = data?.rowData ?? data?.data ?? []
  const rows = transformData ? transformData(rawRows) : rawRows
  const totalCount = data?.rowCount ?? data?.meta?.total ?? data?.total ?? rows.length ?? -1

  return {
    rows,
    totalCount,
  }
}

export const handleGridSuccess = (params, rows, totalCount) => {
  if (typeof params.successCallback === 'function') {
    params.successCallback(rows, totalCount)
    return
  }

  if (typeof params.success === 'function') {
    params.success({ rowData: rows, rowCount: totalCount })
  }
}

export const handleGridFailure = (params) => {
  if (typeof params.failCallback === 'function') {
    params.failCallback()
    return
  }

  if (typeof params.fail === 'function') {
    params.fail()
  }
}