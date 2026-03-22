import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

const mergeOptionsByValue = (...optionGroups) => {
  const seen = new Set()
  const merged = []

  optionGroups.flat().forEach((option) => {
    if (!option || typeof option.value === 'undefined' || seen.has(String(option.value))) return
    seen.add(String(option.value))
    merged.push(option)
  })

  return merged
}

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  name,
  placeholder = 'Pilih...',
  disabled = false,
  error,
  loadOptions,
  debounceMs = 300,
  minSearchLength = 0,
  searchPlaceholder = 'Cari...',
  noOptionsText = 'Tidak ada data',
  loadingText = 'Memuat data...',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [asyncOptions, setAsyncOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const loadOptionsRef = useRef(loadOptions)
  const requestIdRef = useRef(0)

  const mergedOptions = useMemo(() => {
    return mergeOptionsByValue(options, asyncOptions)
  }, [options, asyncOptions])

  const selectedOption = mergedOptions.find((opt) => String(opt.value) === String(value))

  const filteredOptions = useMemo(() => {
    if (loadOptions) return mergedOptions

    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return mergedOptions

    return mergedOptions.filter((opt) =>
      String(opt.label || '').toLowerCase().includes(keyword)
    )
  }, [loadOptions, mergedOptions, searchQuery])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadOptionsRef.current = loadOptions
  }, [loadOptions])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const activeLoadOptions = loadOptionsRef.current
    if (!isOpen || !activeLoadOptions) return

    const keyword = searchQuery.trim()
    if (keyword.length < minSearchLength) {
      setAsyncOptions([])
      setLoadingOptions(false)
      return
    }

    const currentRequestId = ++requestIdRef.current
    const timeoutId = window.setTimeout(async () => {
      setLoadingOptions(true)

      try {
        const result = await activeLoadOptions(keyword)

        if (requestIdRef.current === currentRequestId) {
          setAsyncOptions(Array.isArray(result) ? result : [])
        }
      } catch (err) {
        if (requestIdRef.current === currentRequestId) {
          setAsyncOptions([])
        }
        console.error('Failed to load searchable select options:', err)
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoadingOptions(false)
        }
      }
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [debounceMs, isOpen, minSearchLength, searchQuery])

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ target: { name, value: '' } })
    setSearchQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm cursor-pointer flex items-center justify-between
          ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-300 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800'}
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''}
          ${error ? 'border-red-500' : ''}
          dark:text-white`}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {loadingOptions ? (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 text-center">
                {loadingText}
              </li>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-700
                    ${String(option.value) === String(value) ? 'bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-900 dark:text-white'}`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 text-center">
                {noOptionsText}
              </li>
            )}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-500">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
    </div>
  )
}

export default SearchableSelect