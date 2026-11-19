const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('id-ID')

const makeEntries = (values = []) => values.flatMap(({ value, label, aliases = [] }) => (
  [label, ...aliases].map((candidate) => ({
    label: normalize(candidate),
    value,
  }))
))

const matchesTextOperator = (label, search, type) => {
  switch (type) {
    case 'equals':
    case 'notEqual':
      return label === search
    case 'startsWith':
      return label.startsWith(search)
    case 'endsWith':
      return label.endsWith(search)
    case 'contains':
    case 'notContains':
    default:
      return label.includes(search)
  }
}

const uniqueValues = (values) => [...new Set(values)]

const resolveValues = (filter, config) => {
  const entries = makeEntries(config.values)
  const search = normalize(filter)

  const directValue = config.values.find(({ value }) => normalize(value) === search)?.value
  if (directValue !== undefined) return [directValue]
  if (!search) return []

  const exactLabelValues = uniqueValues(entries
    .filter(({ label }) => label === search)
    .map(({ value }) => value))
  if (exactLabelValues.length > 0) return exactLabelValues

  return uniqueValues(entries
    .filter(({ label }) => matchesTextOperator(label, search, config.operator || 'equals'))
    .map(({ value }) => value))
}

const makeCondition = (colId, value, valueType) => {
  if (valueType === 'boolean') {
    return {
      filterType: 'boolean',
      colId,
      type: value ? 'true' : 'false',
    }
  }

  return {
    filterType: 'number',
    colId,
    type: 'equals',
    filter: value,
  }
}

const makeNoMatchCondition = (colId, config) => {
  if (config.valueType === 'boolean') {
    return {
      filterType: 'join',
      type: 'AND',
      conditions: [
        makeCondition(colId, true, 'boolean'),
        makeCondition(colId, false, 'boolean'),
      ],
    }
  }

  return makeCondition(colId, Number.MIN_SAFE_INTEGER, 'number')
}

const makeMappedCondition = (node, config) => {
  const operator = node.type || 'contains'
  const positiveValues = resolveValues(node.filter, { ...config, operator })
  const negative = operator === 'notContains' || operator === 'notEqual'
  const allValues = uniqueValues(config.values.map(({ value }) => value))
  const selectedValues = negative
    ? allValues.filter((value) => !positiveValues.includes(value))
    : positiveValues

  if (selectedValues.length === 0) return makeNoMatchCondition(node.colId, config)

  const conditions = selectedValues.map((value) => makeCondition(node.colId, value, config.valueType))
  return conditions.length === 1
    ? conditions[0]
    : { filterType: 'join', type: 'OR', conditions }
}

const transformAdvancedNode = (node, mappings) => {
  if (!node || typeof node !== 'object') return node

  if (node.filterType === 'join' && Array.isArray(node.conditions)) {
    return {
      ...node,
      conditions: node.conditions.map((condition) => transformAdvancedNode(condition, mappings)),
    }
  }

  const config = mappings[node.colId]
  return config ? makeMappedCondition(node, config) : node
}

const resolveSimpleFilter = (filter, config) => {
  if (!filter || typeof filter !== 'object' || filter.operator) return []
  if (filter.type === 'notContains' || filter.type === 'notEqual') return []

  return resolveValues(filter.filter, { ...config, operator: filter.type || 'contains' })
}

const resolveDirectValue = (value, config) => {
  const normalizedValue = normalize(value)
  const direct = config.values.find(({ value: candidate }) => normalize(candidate) === normalizedValue)
  if (direct) return direct.value

  const entries = makeEntries(config.values)
  const byLabel = entries.find(({ label }) => label === normalizedValue)
  if (byLabel) return byLabel.value

  const partialValues = uniqueValues(entries
    .filter(({ label }) => label.includes(normalizedValue))
    .map(({ value: candidate }) => candidate))
  return partialValues.length === 1 ? partialValues[0] : undefined
}

/**
 * Converts human-readable AG Grid filters to the number/boolean values stored
 * by the API. Mapped fields are removed from the raw filterModel so Laravel
 * cannot accidentally apply ILIKE to an integer or boolean column.
 */
export const createMappedFilterParamsTransformer = (mappings) => (params) => {
  if (!params || typeof params !== 'object') return params

  const result = { ...params }
  let nextFilterModel = params.filterModel

  Object.entries(mappings).forEach(([field, config]) => {
    if (Object.hasOwn(result, field) && result[field] !== '' && result[field] !== undefined) {
      const directValue = resolveDirectValue(result[field], config)
      if (directValue !== undefined) {
        result[field] = directValue
      } else if (config.valueType === 'number') {
        result[field] = Number.MIN_SAFE_INTEGER
      }
    }

    const filter = params.filterModel?.[field]
    if (!filter) return

    const values = resolveSimpleFilter(filter, config)
    if (values.length === 1) result[field] = values[0]

    nextFilterModel = { ...nextFilterModel }
    delete nextFilterModel[field]
  })

  if (nextFilterModel !== params.filterModel) {
    result.filterModel = nextFilterModel
  }

  if (params.advancedFilterModel) {
    result.advancedFilterModel = transformAdvancedNode(params.advancedFilterModel, mappings)
  }

  return result
}

export const NUMBER_ACTIVE_VALUES = Object.freeze([
  { value: 1, label: 'Aktif', aliases: ['Active', 'Ya'] },
  { value: 0, label: 'Nonaktif', aliases: ['Tidak Aktif', 'Inactive', 'Tidak'] },
])

export const BOOLEAN_ACTIVE_VALUES = Object.freeze([
  { value: true, label: 'Aktif', aliases: ['Active', 'Ya'] },
  { value: false, label: 'Nonaktif', aliases: ['Tidak Aktif', 'Inactive', 'Tidak'] },
])

export const GENDER_VALUES = Object.freeze([
  { value: 1, label: 'Laki-Laki', aliases: ['Laki-laki', 'Laki laki', 'L'] },
  { value: 2, label: 'Perempuan', aliases: ['P'] },
])
