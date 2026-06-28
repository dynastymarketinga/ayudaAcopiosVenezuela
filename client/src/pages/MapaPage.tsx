import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { NavLink } from 'react-router-dom'
import { fetchCentros, type Centro } from '../api/centros'
import { resolveAssetUrl } from '../config/api'
import { fetchHospitals, getCachedHospitals, type Hospital } from '../api/hospitals'
import { CentrosMap } from '../components/CentrosMap'
import { RelativeCreatedAt } from '../components/RelativeCreatedAt'
import { SuministrosDisplay } from '../components/SuministrosDisplay'
import { getTipoLugarLabel, TIPOS_LUGAR, type TipoLugarId } from '../constants/placeTypes'
import { getEstadoName, VENEZUELA_ESTADOS, type EstadoFilter } from '../constants/venezuelaEstados'
import { countArticulos } from '../constants/supplies'
import { matchesEstadoFilter, resolveEstado } from '../utils/estado'

type MapSelection =
  | { kind: 'centro'; data: Centro }
  | { kind: 'hospital'; data: Hospital }

type MapListItem = MapSelection

function getSelectionId(selection: MapSelection | null) {
  if (!selection) return null
  return selection.kind === 'centro' ? selection.data._id : selection.data.id
}

interface CentroCardProps {
  centro: Centro
  expanded: boolean
  onToggle: () => void
  cardRef?: RefObject<HTMLLIElement | null>
}

function CentroCard({ centro, expanded, onToggle, cardRef }: CentroCardProps) {
  const articulosCount = countArticulos(centro.suministrosNecesarios)
  const categoriasCount = centro.suministrosNecesarios.length

  return (
    <li ref={cardRef} className={`centro-card ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="centro-card-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="centro-card-summary">
          <strong>{centro.nombre}</strong>
          <span className="tipo-badge-inline">{getTipoLugarLabel(centro.tipoLugar)}</span>
          <RelativeCreatedAt date={centro.createdAt} />
          {!expanded && centro.direccion && (
            <span className="centro-card-address">{centro.direccion}</span>
          )}
          {!expanded && articulosCount > 0 && (
            <span className="centro-badge">
              {articulosCount} artículo{articulosCount !== 1 ? 's' : ''} · {categoriasCount}{' '}
              categoría{categoriasCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="centro-card-chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="centro-card-body">
          {centro.imagenPrincipal && (
            <img
              src={resolveAssetUrl(centro.imagenPrincipal)}
              alt={`Foto de ${centro.nombre}`}
              className="centro-card-image"
            />
          )}

          {centro.direccion && <p className="centro-detail-address">{centro.direccion}</p>}

          {typeof centro.lat === 'number' && typeof centro.lng === 'number' && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${centro.lat},${centro.lng}`}
              target="_blank"
              rel="noreferrer"
              className="btn-google-maps"
            >
              Abrir en Google Maps
            </a>
          )}

          {(centro.telefonos.length > 0 ||
            centro.correosContacto.length > 0 ||
            centro.sitiosWeb.length > 0) && (
            <div className="centro-contact">
              {centro.telefonos.map((telefono) => (
                <a key={telefono} href={`tel:${telefono.replace(/\s/g, '')}`} className="contact-link">
                  {telefono}
                </a>
              ))}
              {centro.correosContacto.map((correo) => (
                <a key={correo} href={`mailto:${correo}`} className="contact-link">
                  {correo}
                </a>
              ))}
              {centro.sitiosWeb.map((sitio) => (
                <a
                  key={sitio}
                  href={sitio.startsWith('http') ? sitio : `https://${sitio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-link"
                >
                  {sitio.replace(/^https?:\/\//, '')}
                </a>
              ))}
            </div>
          )}

          <h3>Suministros necesarios</h3>
          {articulosCount > 0 ? (
            <SuministrosDisplay items={centro.suministrosNecesarios} compact />
          ) : (
            <p className="empty">Este centro no ha registrado suministros aún.</p>
          )}
        </div>
      )}
    </li>
  )
}

interface HospitalCardProps {
  hospital: Hospital
  expanded: boolean
  onToggle: () => void
  cardRef?: RefObject<HTMLLIElement | null>
}

function HospitalCard({ hospital, expanded, onToggle, cardRef }: HospitalCardProps) {
  return (
    <li ref={cardRef} className={`centro-card hospital-card ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="centro-card-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="centro-card-summary">
          <strong>{hospital.nombre}</strong>
          <span className="tipo-badge-inline">{getTipoLugarLabel('hospital')}</span>
          {!expanded && hospital.direccion && (
            <span className="centro-card-address">{hospital.direccion}</span>
          )}
          {!expanded && <span className="centro-badge">OpenStreetMap</span>}
        </div>
        <span className="centro-card-chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="centro-card-body">
          <p className="mapa-osm-note">Hospital registrado en OpenStreetMap.</p>
          {hospital.direccion && <p className="centro-detail-address">{hospital.direccion}</p>}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`}
            target="_blank"
            rel="noreferrer"
            className="btn-google-maps"
          >
            Abrir en Google Maps
          </a>

          {hospital.telefono && (
            <div className="centro-contact">
              <a href={`tel:${hospital.telefono.replace(/\s/g, '')}`} className="contact-link">
                {hospital.telefono}
              </a>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function MapaPage() {
  const [centros, setCentros] = useState<Centro[]>([])
  const [hospitales, setHospitales] = useState<Hospital[]>(() => getCachedHospitals() ?? [])
  const [selected, setSelected] = useState<MapSelection | null>(null)
  const [tipoFilters, setTipoFilters] = useState<Set<TipoLugarId>>(() => new Set())
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')
  const [nameSearch, setNameSearch] = useState('')
  const [loadingCentros, setLoadingCentros] = useState(true)
  const [loadingHospitales, setLoadingHospitales] = useState(() => getCachedHospitals() === null)
  const [errorCentros, setErrorCentros] = useState<string | null>(null)
  const [errorHospitales, setErrorHospitales] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarWide, setSidebarWide] = useState(false)
  const expandedCardRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    fetchCentros()
      .then(setCentros)
      .catch(() => setErrorCentros('No se pudieron cargar los centros de acopio'))
      .finally(() => setLoadingCentros(false))
  }, [])

  useEffect(() => {
    fetchHospitals()
      .then(setHospitales)
      .catch(() => setErrorHospitales('No se pudieron cargar los hospitales'))
      .finally(() => setLoadingHospitales(false))
  }, [])

  const showHospitales = tipoFilters.size === 0 || tipoFilters.has('hospital')
  const query = nameSearch.trim().toLowerCase()
  const showHospitalList =
    showHospitales && (tipoFilters.size > 0 || !!query || estadoFilter !== 'todos')

  const filteredCentros = useMemo(() => {
    let result = centros
    if (tipoFilters.size > 0) {
      result = result.filter((centro) => tipoFilters.has(centro.tipoLugar))
    }
    if (estadoFilter !== 'todos') {
      result = result.filter((centro) => matchesEstadoFilter(centro, estadoFilter))
    }
    if (query) {
      result = result.filter((centro) => centro.nombre.toLowerCase().includes(query))
    }
    return result
  }, [centros, tipoFilters, estadoFilter, query])

  const filteredHospitales = useMemo(() => {
    if (!showHospitales) return []
    let result = hospitales
    if (estadoFilter !== 'todos') {
      result = result.filter((hospital) => matchesEstadoFilter(hospital, estadoFilter))
    }
    if (query) {
      result = result.filter((hospital) => hospital.nombre.toLowerCase().includes(query))
    }
    return result
  }, [hospitales, showHospitales, estadoFilter, query])

  const estadoCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const centro of centros) {
      const estadoId = resolveEstado(centro)
      if (!estadoId) continue
      counts.set(estadoId, (counts.get(estadoId) ?? 0) + 1)
    }

    for (const hospital of hospitales) {
      const estadoId = resolveEstado(hospital)
      if (!estadoId) continue
      counts.set(estadoId, (counts.get(estadoId) ?? 0) + 1)
    }

    return counts
  }, [centros, hospitales])

  const sidebarHospitales = useMemo(() => {
    if (!showHospitales) return []
    if (!showHospitalList) {
      if (selected?.kind === 'hospital') return [selected.data]
      return []
    }
    const list = filteredHospitales.slice(0, 80)
    if (selected?.kind === 'hospital' && !list.some((h) => h.id === selected.data.id)) {
      return [selected.data, ...list].slice(0, 81)
    }
    return list
  }, [filteredHospitales, showHospitales, showHospitalList, selected])

  const mapItems = useMemo((): MapListItem[] => {
    const items: MapListItem[] = [
      ...filteredCentros.map((centro) => ({ kind: 'centro' as const, data: centro })),
      ...sidebarHospitales.map((hospital) => ({ kind: 'hospital' as const, data: hospital })),
    ]
    return items.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'))
  }, [filteredCentros, sidebarHospitales])

  useEffect(() => {
    if (!selected) return
    if (selected.kind === 'centro') {
      const visible = filteredCentros.some((centro) => centro._id === selected.data._id)
      if (!visible) setSelected(null)
      return
    }
    const visible = filteredHospitales.some((hospital) => hospital.id === selected.data.id)
    if (!visible) setSelected(null)
  }, [filteredCentros, filteredHospitales, selected])

  useEffect(() => {
    if (selected) {
      expandedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selected])

  function handleSelectCentro(centro: Centro, toggle = false) {
    setSelected((prev) => {
      if (toggle && prev?.kind === 'centro' && prev.data._id === centro._id) return null
      return { kind: 'centro', data: centro }
    })
    setSidebarOpen(true)
  }

  function handleSelectHospital(hospital: Hospital, toggle = false) {
    setSelected((prev) => {
      if (toggle && prev?.kind === 'hospital' && prev.data.id === hospital.id) return null
      return { kind: 'hospital', data: hospital }
    })
    setSidebarOpen(true)
  }

  function toggleTipoFilter(tipoId: TipoLugarId) {
    setTipoFilters((prev) => {
      const next = new Set(prev)
      if (next.has(tipoId)) next.delete(tipoId)
      else next.add(tipoId)
      return next
    })
  }

  function clearTipoFilters() {
    setTipoFilters(new Set())
  }

  const loading = loadingCentros
  const sidebarTotal = filteredCentros.length + sidebarHospitales.length
  const hospitalsOnMap = showHospitales ? filteredHospitales : []

  return (
    <div
      className={`mapa-page ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarWide ? 'sidebar-wide' : ''}`}
    >
      {sidebarOpen && (
        <button
          type="button"
          className="mapa-sidebar-backdrop"
          aria-label="Cerrar panel"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="mapa-sidebar">
        <div className="mapa-sidebar-header">
          <h1>Mapa de ayuda</h1>
          <div className="mapa-sidebar-actions">
            <button
              type="button"
              className="mapa-sidebar-expand"
              onClick={() => setSidebarWide((wide) => !wide)}
              aria-label={sidebarWide ? 'Reducir panel' : 'Expandir panel'}
              title={sidebarWide ? 'Reducir panel' : 'Expandir panel'}
            >
              {sidebarWide ? '‹' : '›'}
            </button>
            <button
              type="button"
              className="mapa-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar panel"
            >
              ×
            </button>
          </div>
        </div>
        <p className="mapa-subtitle">
          Centros de acopio registrados y hospitales de Venezuela. Haz clic para ver más
          información.
        </p>

        <section className="centro-name-search">
          <label htmlFor="centro-name-search-input">Buscar por nombre</label>
          <input
            id="centro-name-search-input"
            type="search"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Ej: Hospital Central, Centro comunitario..."
          />
        </section>

        <section className="estado-filter">
          <label htmlFor="estado-filter-select">Filtrar por estado</label>
          <select
            id="estado-filter-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
          >
            <option value="todos">Todos los estados</option>
            {VENEZUELA_ESTADOS.map((estado) => {
              const count = estadoCounts.get(estado.id) ?? 0
              return (
                <option key={estado.id} value={estado.id} disabled={count === 0}>
                  {estado.name}
                  {count > 0 ? ` (${count})` : ''}
                </option>
              )
            })}
          </select>
        </section>

        {errorCentros && <p className="error">{errorCentros}</p>}
        {errorHospitales && <p className="error">{errorHospitales}</p>}

        <section className="tipo-filter">
          <h3>Filtrar por tipo</h3>
          <div className="tipo-filter-chips">
            <button
              type="button"
              className={`tipo-chip ${tipoFilters.size === 0 ? 'active' : ''}`}
              onClick={clearTipoFilters}
              aria-pressed={tipoFilters.size === 0}
            >
              Todos
            </button>
            {TIPOS_LUGAR.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                className={`tipo-chip ${tipoFilters.has(tipo.id) ? 'active' : ''}`}
                onClick={() => toggleTipoFilter(tipo.id)}
                aria-pressed={tipoFilters.has(tipo.id)}
              >
                <span className="tipo-chip-dot" style={{ background: tipo.color }} />
                {tipo.label}
              </button>
            ))}
          </div>
        </section>

        {!loadingHospitales && showHospitales && filteredHospitales.length > 0 && (
          <p className="mapa-stats">
            {filteredHospitales.length} hospital{filteredHospitales.length !== 1 ? 'es' : ''} en el
            mapa
            {filteredCentros.length > 0 &&
              ` · ${filteredCentros.length} centro${filteredCentros.length !== 1 ? 's' : ''} de acopio`}
          </p>
        )}

        {loadingHospitales && (
          <p className="mapa-stats mapa-stats-loading">Cargando hospitales en segundo plano…</p>
        )}

        {showHospitales && !loadingHospitales && !showHospitalList && (
          <p className="mapa-hint">
            Los hospitales se muestran agrupados en el mapa. Busca por nombre, filtra por estado o
            selecciona uno o más tipos (incluyendo Hospital) para ver la lista.
          </p>
        )}

        {loading ? (
          <p>Cargando centros...</p>
        ) : sidebarTotal === 0 && filteredCentros.length === 0 && hospitalsOnMap.length === 0 ? (
          <p className="empty">
            {centros.length === 0 && hospitales.length === 0
              ? 'Aún no hay lugares para mostrar.'
              : nameSearch.trim()
                ? `No hay resultados para "${nameSearch.trim()}".`
                : estadoFilter !== 'todos'
                  ? `No hay lugares en ${getEstadoName(estadoFilter)} con estos filtros.`
                  : 'No hay lugares de este tipo en el mapa.'}
          </p>
        ) : sidebarTotal === 0 && hospitalsOnMap.length > 0 ? (
          <p className="empty">
            {filteredCentros.length === 0
              ? 'Selecciona Hospital u otros filtros para ver la lista de hospitales.'
              : 'No hay centros de acopio con ese criterio. Los hospitales están visibles en el mapa.'}
          </p>
        ) : (
          <ul className="centros-grid">
            {mapItems.map((item) => {
              const expanded =
                selected?.kind === item.kind &&
                getSelectionId(selected) === getSelectionId(item)

              if (item.kind === 'centro') {
                return (
                  <CentroCard
                    key={item.data._id}
                    centro={item.data}
                    expanded={expanded}
                    onToggle={() => handleSelectCentro(item.data, true)}
                    cardRef={expanded ? expandedCardRef : undefined}
                  />
                )
              }

              return (
                <HospitalCard
                  key={item.data.id}
                  hospital={item.data}
                  expanded={expanded}
                  onToggle={() => handleSelectHospital(item.data, true)}
                  cardRef={expanded ? expandedCardRef : undefined}
                />
              )
            })}
          </ul>
        )}

        <nav className="mapa-sidebar-nav">
          <NavLink to="/mapa" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setSidebarOpen(false)}>
            Mapa
          </NavLink>
          <NavLink to="/panel" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setSidebarOpen(false)}>
            Crear centro de acopio
          </NavLink>
        </nav>
      </aside>

      <div className="mapa-map">
        <button
          type="button"
          className="mapa-menu-toggle"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Cerrar lista de lugares' : 'Abrir lista de lugares'}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <CentrosMap
          centros={filteredCentros}
          hospitales={hospitalsOnMap}
          showHospitales={showHospitales}
          selectedId={getSelectionId(selected)}
          onSelectCentro={(centro) => handleSelectCentro(centro)}
          onSelectHospital={(hospital) => handleSelectHospital(hospital)}
          fullScreen
        />
      </div>
    </div>
  )
}
