import { createMappedFilterParamsTransformer } from '../../../components/ui/mappedFilterParams'
import { ATTENDANCE_STATUS_VALUES } from '../../../utils/gridFilterMappings'

export const getStatusCode = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  const option = ATTENDANCE_STATUS_VALUES.find(({ value: code, label, aliases = [] }) => (
    String(code) === normalized
    || [label, ...aliases].some((candidate) => candidate.toLowerCase() === normalized)
  ))

  return option?.value ?? null
}

/**
 * The grid displays attendance status labels while both attendance backends
 * store the value as an integer. Keep the label-friendly text filter, but send
 * its exact label as the corresponding numeric status.
 */
export const transformStatusFilterParams = createMappedFilterParamsTransformer({
  status: {
    valueType: 'number',
    values: ATTENDANCE_STATUS_VALUES,
  },
})
