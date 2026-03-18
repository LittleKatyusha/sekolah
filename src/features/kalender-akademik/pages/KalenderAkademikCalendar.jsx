import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { Plus, RefreshCw, Calendar, List, Filter, ChevronDown, Loader2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { kalenderAkademikService } from '../services/kalenderAkademikService'
import { showError } from '../../../utils/sweetalert'

// Status mapping for display
const STATUS_MAP = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  PENDING: { label: 'Pending', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  APPROVED: { label: 'Approved', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

/**
 * Transform API events to FullCalendar event format
 */
const transformToCalendarEvents = (events) => {
  return events.map(event => {
    // FullCalendar end date for allDay events is exclusive, so add 1 day
    let endDate = event.tanggal_selesai
    if (event.is_all_day !== false && endDate) {
      const d = new Date(endDate)
      d.setDate(d.getDate() + 1)
      endDate = d.toISOString().split('T')[0]
    }

    return {
      id: String(event.id),
      title: event.judul,
      start: event.tanggal_mulai,
      end: endDate,
      allDay: event.is_all_day !== false,
      backgroundColor: event.tipe?.warna || '#6b7280',
      borderColor: event.tipe?.warna || '#6b7280',
      extendedProps: {
        deskripsi: event.deskripsi,
        lokasi: event.lokasi,
        status: event.status,
        visibility: event.visibility,
        tipe: event.tipe,
        tahun_ajaran: event.tahun_ajaran,
      }
    }
  })
}

const KalenderAkademikCalendar = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const calendarRef = useRef(null)

  // State
  const [events, setEvents] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filters
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('')
  const [filterTipe, setFilterTipe] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  /**
   * Fetch event types for legend and filter
   */
  const fetchEventTypes = useCallback(async () => {
    const { data, error } = await kalenderAkademikService.getAllTipe({ per_page: 100 })
    if (!error && data?.data) {
      const types = Array.isArray(data.data) ? data.data : data.data.data || []
      setEventTypes(types)
    }
  }, [])

  /**
   * Extract unique tahun ajaran from events for filter
   */
  const extractTahunAjaran = useCallback((eventsList) => {
    const map = new Map()
    eventsList.forEach(evt => {
      if (evt.tahun_ajaran?.id && evt.tahun_ajaran?.nama) {
        map.set(evt.tahun_ajaran.id, evt.tahun_ajaran)
      }
    })
    setTahunAjaranList(Array.from(map.values()))
  }, [])

  /**
   * Fetch calendar events
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterTahunAjaran) params.tahun_ajaran_id = filterTahunAjaran
      if (filterTipe) params.tipe_id = filterTipe
      if (filterStatus) params.status = filterStatus

      const { data, error } = await kalenderAkademikService.getAllForCalendar(params)
      if (error) {
        showError('Gagal memuat data kalender akademik')
        setEvents([])
        return
      }

      // Handle paginated response structure
      const rawEvents = data?.data?.data || data?.data || []
      const eventsList = Array.isArray(rawEvents) ? rawEvents : []
      
      extractTahunAjaran(eventsList)
      setEvents(transformToCalendarEvents(eventsList))
    } catch (err) {
      showError('Terjadi kesalahan saat memuat data')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [filterTahunAjaran, filterTipe, filterStatus, extractTahunAjaran])

  // Initial data fetch
  useEffect(() => {
    fetchEventTypes()
  }, [fetchEventTypes])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  /**
   * Handle event click - navigate to detail
   */
  const handleEventClick = useCallback((clickInfo) => {
    const eventId = clickInfo.event.id
    navigate(`${eventId}/edit`)
  }, [navigate])

  /**
   * Handle date click - navigate to create form with pre-filled date
   */
  const handleDateClick = useCallback((dateInfo) => {
    const dateStr = dateInfo.dateStr
    navigate(`create?date=${dateStr}`)
  }, [navigate])

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    fetchEvents()
    fetchEventTypes()
  }, [fetchEvents, fetchEventTypes])

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilterTahunAjaran('')
    setFilterTipe('')
    setFilterStatus('')
  }, [])

  const hasActiveFilters = filterTahunAjaran || filterTipe || filterStatus

  /**
   * Custom event content renderer
   */
  const renderEventContent = useCallback((eventInfo) => {
    const { event } = eventInfo
    const status = event.extendedProps?.status
    const statusInfo = STATUS_MAP[status]

    return (
      <div className="fc-custom-event px-1.5 py-0.5 overflow-hidden w-full">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-medium text-xs truncate">{event.title}</span>
          {statusInfo && status !== 'APPROVED' && (
            <span className="flex-shrink-0 text-[10px] opacity-80">
              ({statusInfo.label})
            </span>
          )}
        </div>
        {event.extendedProps?.lokasi && (
          <div className="text-[10px] opacity-75 truncate">
            📍 {event.extendedProps.lokasi}
          </div>
        )}
      </div>
    )
  }, [])

  /**
   * FullCalendar toolbar configuration
   */
  const headerToolbar = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth'
  }), [])

  const buttonText = useMemo(() => ({
    today: 'Hari Ini',
    month: 'Bulan',
    list: 'Daftar'
  }), [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-600" />
            Kalender Akademik
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola jadwal dan event akademik sekolah
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('list')}
            className="gap-1.5"
          >
            <List size={16} />
            <span className="hidden sm:inline">Tabel</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('create')}
            className="gap-1.5"
          >
            <Plus size={16} />
            Tambah Event
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="!p-3">
        <div className="flex flex-col gap-3">
          {/* Filter toggle for mobile */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center justify-between sm:hidden text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filter
              {hasActiveFilters && (
                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs px-1.5 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </span>
            <ChevronDown size={16} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter dropdowns */}
          <div className={`flex flex-col sm:flex-row gap-3 ${filtersOpen ? 'block' : 'hidden sm:flex'}`}>
            {/* Tahun Ajaran Filter */}
            <div className="flex-1 min-w-0">
              <select
                value={filterTahunAjaran}
                onChange={(e) => setFilterTahunAjaran(e.target.value)}
                className="input-field text-sm w-full"
              >
                <option value="">Semua Tahun Ajaran</option>
                {tahunAjaranList.map(ta => (
                  <option key={ta.id} value={ta.id}>{ta.nama}</option>
                ))}
              </select>
            </div>

            {/* Tipe Filter */}
            <div className="flex-1 min-w-0">
              <select
                value={filterTipe}
                onChange={(e) => setFilterTipe(e.target.value)}
                className="input-field text-sm w-full"
              >
                <option value="">Semua Tipe</option>
                {eventTypes.map(tipe => (
                  <option key={tipe.id} value={tipe.id}>{tipe.nama}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field text-sm w-full"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
                className="whitespace-nowrap"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Legend */}
      {eventTypes.length > 0 && (
        <Card className="!p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Legenda:
            </span>
            {eventTypes.map(tipe => (
              <div key={tipe.id} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: tipe.warna || '#6b7280' }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {tipe.nama}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card className="!p-2 sm:!p-4 kalender-akademik-calendar">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Memuat kalender...</span>
          </div>
        )}
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={headerToolbar}
            buttonText={buttonText}
            locale="id"
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(num) => `+${num} lainnya`}
            noEventsText="Tidak ada event"
            weekNumbers={false}
            navLinks={true}
            editable={false}
            selectable={false}
            eventDisplay="block"
            displayEventTime={false}
            fixedWeekCount={false}
            showNonCurrentDates={true}
            dayHeaderFormat={{ weekday: 'short' }}
            titleFormat={{ year: 'numeric', month: 'long' }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
          />
        </div>
      </Card>
    </div>
  )
}

export default KalenderAkademikCalendar
