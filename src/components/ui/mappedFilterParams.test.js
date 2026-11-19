import { describe, expect, it } from 'vitest'
import {
  BOOLEAN_ACTIVE_VALUES,
  createMappedFilterParamsTransformer,
  GENDER_VALUES,
} from './mappedFilterParams'

describe('createMappedFilterParamsTransformer', () => {
  it('converts a label to a numeric direct and advanced filter', () => {
    const transform = createMappedFilterParamsTransformer({
      status: {
        valueType: 'number',
        values: [
          { value: 1, label: 'Hadir' },
          { value: 2, label: 'Izin' },
        ],
      },
    })

    expect(transform({
      filterModel: { status: { filterType: 'text', type: 'contains', filter: 'izin' } },
      advancedFilterModel: { filterType: 'text', colId: 'status', type: 'contains', filter: 'izin' },
    })).toEqual({
      status: 2,
      filterModel: {},
      advancedFilterModel: { filterType: 'number', colId: 'status', type: 'equals', filter: 2 },
    })
  })

  it('supports partial labels by producing an OR condition', () => {
    const transform = createMappedFilterParamsTransformer({
      status: {
        valueType: 'number',
        values: [
          { value: 1, label: 'Aktif' },
          { value: 2, label: 'Tidak Aktif' },
        ],
      },
    })

    const result = transform({
      filterModel: { status: { type: 'contains', filter: 'ti' } },
      advancedFilterModel: { filterType: 'text', colId: 'status', type: 'contains', filter: 'ti' },
    })

    expect(result.status).toBeUndefined()
    expect(result.advancedFilterModel).toEqual({
      filterType: 'join',
      type: 'OR',
      conditions: [
        { filterType: 'number', colId: 'status', type: 'equals', filter: 1 },
        { filterType: 'number', colId: 'status', type: 'equals', filter: 2 },
      ],
    })
  })

  it('creates valid boolean conditions', () => {
    const transform = createMappedFilterParamsTransformer({
      is_active: { valueType: 'boolean', values: BOOLEAN_ACTIVE_VALUES },
    })

    const result = transform({
      filterModel: { is_active: { type: 'equals', filter: 'nonaktif' } },
      advancedFilterModel: { filterType: 'text', colId: 'is_active', type: 'equals', filter: 'nonaktif' },
    })

    expect(result.is_active).toBe(false)
    expect(result.advancedFilterModel).toEqual({
      filterType: 'boolean',
      colId: 'is_active',
      type: 'false',
    })
  })

  it('maps legacy top-level query values', () => {
    const transform = createMappedFilterParamsTransformer({
      jenis_kelamin: { valueType: 'number', values: GENDER_VALUES },
    })

    expect(transform({ jenis_kelamin: 'Perempuan', page: 1 })).toEqual({
      jenis_kelamin: 2,
      page: 1,
    })
    expect(transform({ jenis_kelamin: 'remp' })).toEqual({ jenis_kelamin: 2 })
  })

  it('uses an exact label before broader contains matches', () => {
    const transform = createMappedFilterParamsTransformer({
      is_active: {
        valueType: 'number',
        values: [
          { value: 1, label: 'Aktif' },
          { value: 0, label: 'Nonaktif' },
        ],
      },
    })

    const result = transform({
      filterModel: { is_active: { type: 'contains', filter: 'aktif' } },
      advancedFilterModel: { filterType: 'text', colId: 'is_active', type: 'contains', filter: 'aktif' },
    })

    expect(result.is_active).toBe(1)
    expect(result.advancedFilterModel.filter).toBe(1)
  })

  it('turns an unknown number label into a safe no-match condition', () => {
    const transform = createMappedFilterParamsTransformer({
      status: { valueType: 'number', values: [{ value: 1, label: 'Aktif' }] },
    })

    const result = transform({
      filterModel: { status: { type: 'contains', filter: 'asing' } },
      advancedFilterModel: { filterType: 'text', colId: 'status', type: 'contains', filter: 'asing' },
    })

    expect(result.filterModel).toEqual({})
    expect(result.advancedFilterModel.filter).toBe(Number.MIN_SAFE_INTEGER)
  })
})
