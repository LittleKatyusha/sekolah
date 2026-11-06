import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import JadwalHarianEditor from './JadwalHarianEditor'

describe('JadwalHarianEditor', () => {
  it('renders all 7 days of the week', () => {
    render(
      <JadwalHarianEditor
        jadwalHarian={null}
        onChange={vi.fn()}
        defaultJamMasuk="07:00"
        defaultJamPulang="14:20"
      />
    )

    expect(screen.getByText('Senin')).toBeInTheDocument()
    expect(screen.getByText('Selasa')).toBeInTheDocument()
    expect(screen.getByText('Rabu')).toBeInTheDocument()
    expect(screen.getByText('Kamis')).toBeInTheDocument()
    expect(screen.getByText('Jumat')).toBeInTheDocument()
    expect(screen.getByText('Sabtu')).toBeInTheDocument()
    expect(screen.getByText('Minggu')).toBeInTheDocument()
  })

  it('triggers quick preset for Friday when clicked', () => {
    const handleChange = vi.fn()
    render(
      <JadwalHarianEditor
        jadwalHarian={null}
        onChange={handleChange}
        defaultJamMasuk="07:00"
        defaultJamPulang="14:20"
      />
    )

    const presetBtn = screen.getByText(/Preset Jumat 11:30/i)
    fireEvent.click(presetBtn)

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        FRI: {
          jam_masuk: '07:00',
          jam_pulang: '11:30',
        },
      })
    )
  })

  it('displays custom time inputs when day is overridden', () => {
    const customSchedule = {
      FRI: {
        jam_masuk: '07:00',
        jam_pulang: '11:30',
      },
    }

    render(
      <JadwalHarianEditor
        jadwalHarian={customSchedule}
        onChange={vi.fn()}
        defaultJamMasuk="07:00"
        defaultJamPulang="14:20"
      />
    )

    expect(screen.getByText('Khusus')).toBeInTheDocument()
    expect(screen.getByDisplayValue('11:30')).toBeInTheDocument()
  })
})
