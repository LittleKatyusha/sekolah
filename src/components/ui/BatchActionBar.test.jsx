import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BatchActionBar from './BatchActionBar'

describe('BatchActionBar Component', () => {
  it('does not render when selectedCount is 0', () => {
    const { container } = render(
      <BatchActionBar
        selectedCount={0}
        itemLabel="siswa"
        onDelete={vi.fn()}
        onExport={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders correctly with count and triggers actions', () => {
    const onDelete = vi.fn()
    const onExport = vi.fn()
    const onClear = vi.fn()

    render(
      <BatchActionBar
        selectedCount={5}
        itemLabel="siswa"
        onDelete={onDelete}
        onExport={onExport}
        onClear={onClear}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('siswa terpilih')).toBeInTheDocument()

    const deleteBtn = screen.getByRole('button', { name: /Hapus Terpilih/i })
    const exportBtn = screen.getByRole('button', { name: /Export Excel Terpilih/i })
    const clearBtn = screen.getByRole('button', { name: /Batal/i })

    expect(deleteBtn).toBeInTheDocument()
    expect(exportBtn).toBeInTheDocument()
    expect(clearBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledTimes(1)

    fireEvent.click(exportBtn)
    expect(onExport).toHaveBeenCalledTimes(1)

    fireEvent.click(clearBtn)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('hides delete button when canDelete is false', () => {
    render(
      <BatchActionBar
        selectedCount={3}
        itemLabel="guru"
        canDelete={false}
        onDelete={vi.fn()}
        onExport={vi.fn()}
        onClear={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /Hapus Terpilih/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export Excel Terpilih/i })).toBeInTheDocument()
  })
})
