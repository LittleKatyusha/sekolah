export const normalizeReferenceCode = (rawValue, options, { matchLabel = true } = {}) => {
  if (rawValue === null || rawValue === undefined) return ''
  const valueStr = String(rawValue)
  if (!valueStr) return ''

  const opts = Array.isArray(options) ? options : []

  // 1) Match by option.value
  const direct = opts.find((opt) => String(opt?.value) === valueStr)
  if (direct) return String(direct.value)

  // 2) Match by label (API sometimes returns label instead of code)
  if (matchLabel) {
    const normalized = valueStr.trim().toLowerCase()
    const byLabel = opts.find((opt) => String(opt?.label ?? '').trim().toLowerCase() === normalized)
    if (byLabel) return String(byLabel.value)
  }

  // 3) Fallback: keep as-is
  return valueStr
}

export const safeParseInt = (value) => {
  if (value === null || value === undefined) return null
  const str = String(value)
  if (!str) return null
  const parsed = Number.parseInt(str, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export const safeParseFloat = (value) => {
  if (value === null || value === undefined) return null
  const str = String(value)
  if (!str) return null
  const parsed = Number.parseFloat(str)
  return Number.isNaN(parsed) ? null : parsed
}
