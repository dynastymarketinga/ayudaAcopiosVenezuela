import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { searchAddress, type GeocodeResult } from '../api/geocode'

interface AddressSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (result: GeocodeResult) => void
}

export function AddressSearch({ value, onChange, onSelect }: AddressSearchProps) {
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function runSearch(query: string) {
    if (query.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }

    setSearching(true)
    setError(null)

    try {
      const data = await searchAddress(query.trim())
      setResults(data)
      setOpen(data.length > 0)
      setHighlightIndex(-1)
    } catch (err) {
      setResults([])
      setOpen(false)
      setError(err instanceof Error ? err.message : 'Error al buscar')
    } finally {
      setSearching(false)
    }
  }

  function handleInputChange(text: string) {
    onChange(text)
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      runSearch(text)
    }, 400)
  }

  function handleSelect(result: GeocodeResult) {
    onChange(result.displayName)
    onSelect(result)
    setOpen(false)
    setResults([])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault()
      handleSelect(results[highlightIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="address-search" ref={wrapperRef}>
      <label>
        Buscar dirección
        <div className="address-search-input-wrap">
          <input
            type="search"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Av. Libertador, Caracas"
            autoComplete="off"
          />
          {searching && <span className="address-search-spinner">Buscando...</span>}
        </div>
      </label>

      {error && <p className="address-search-error">{error}</p>}

      {open && results.length > 0 && (
        <ul className="address-search-results" role="listbox">
          {results.map((result, index) => (
            <li key={result.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                className={index === highlightIndex ? 'highlighted' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(result)}
              >
                {result.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="address-search-hint">
        Escribe una dirección y selecciona un resultado para ubicar tu centro en el mapa.
      </p>
    </div>
  )
}
