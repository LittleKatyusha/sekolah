import { describe, expect, it } from 'vitest'
import { getStatusCode, transformStatusFilterParams } from './statusFilter'

describe('attendance status filter', () => {
  it.each([
    ['Hadir', 1],
    ['izin', 2],
    [' SAKIT ', 3],
    ['alpha', 4],
    ['alpa', 4],
    ['terlambat', 5],
    ['2', 2],
  ])('maps %s to database status %s', (label, code) => {
    expect(getStatusCode(label)).toBe(code)
  })

  it('adds the numeric status expected by both attendance backends', () => {
    const params = {
      startRow: 0,
      endRow: 20,
      filterModel: {
        status: { filterType: 'text', type: 'contains', filter: 'izin' },
      },
      advancedFilterModel: {
        filterType: 'text',
        colId: 'status',
        type: 'contains',
        filter: 'izin',
      },
    }

    expect(transformStatusFilterParams(params)).toEqual({
      startRow: 0,
      endRow: 20,
      status: 2,
      filterModel: {},
      advancedFilterModel: {
        filterType: 'number',
        colId: 'status',
        type: 'equals',
        filter: 2,
      },
    })
  })

  it('removes unknown text before it reaches an integer column', () => {
    const params = {
      filterModel: {
        status: { filterType: 'text', type: 'contains', filter: 'tidak dikenal' },
      },
    }

    expect(transformStatusFilterParams(params)).toEqual({ filterModel: {} })
  })

  it('does not flatten combined filters into an incorrect status value', () => {
    const params = {
      filterModel: {
        status: {
          filterType: 'text',
          operator: 'OR',
          condition1: { filterType: 'text', type: 'equals', filter: 'izin' },
          condition2: { filterType: 'text', type: 'equals', filter: 'sakit' },
        },
      },
    }

    expect(transformStatusFilterParams(params)).toEqual({ filterModel: {} })
  })
})
