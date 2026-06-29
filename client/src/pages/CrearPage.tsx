import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { GeocodeResult } from '../api/geocode'
import { createCentro, uploadCentroImagenesPublic } from '../api/centros'
import { AddressSearch } from '../components/AddressSearch'
import { cleanContactList, ContactListField } from '../components/ContactListField'
import { MapPicker } from '../components/MapPicker'
import { SuministrosPicker } from '../components/SuministrosPicker'
import { DEFAULT_TIPO_LUGAR, TIPOS_LUGAR, type TipoLugarId } from '../constants/placeTypes'
import { DEFAULT_PRIORIDAD, PRIORIDADES, type PrioridadId } from '../constants/prioridades'
import type { SuministroNecesario } from '../constants/supplies'

const MAX_IMAGES = 10
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

export function CrearPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const nombreInputRef = useRef<HTMLInputElement>(null)
  const ubicacionSectionRef = useRef<HTMLElement>(null)
  const submitBarRef = useRef<HTMLDivElement>(null)
  const [nombre, setNombre] = useState('')
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [direccion, setDireccion] = useState('')
  const [telefonos, setTelefonos] = useState<string[]>([''])
  const [correosContacto, setCorreosContacto] = useState<string[]>([''])
  const [sitiosWeb, setSitiosWeb] = useState<string[]>([''])
  const [tipoLugar, setTipoLugar] = useState<TipoLugarId>(DEFAULT_TIPO_LUGAR)
  const [prioridad, setPrioridad] = useState<PrioridadId>(DEFAULT_PRIORIDAD)
  const [suministros, setSuministros] = useState<SuministroNecesario[]>([])
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombreError, setNombreError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const isNombreValid = nombre.trim().length > 0
  const hasSuministros = suministros.length > 0
  const canSubmit = isNombreValid && position !== null

  useEffect(() => {
    const urls = pendingImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [pendingImages])

  function scrollToFeedback(target: HTMLElement | null) {
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return
    setPendingImages((current) => {
      const combined = [...current, ...files]
      if (combined.length > MAX_IMAGES) {
        setError(`Máximo ${MAX_IMAGES} imágenes`)
        scrollToFeedback(submitBarRef.current)
        return current
      }
      setError(null)
      return combined
    })
  }

  function handleAddressSelect(result: GeocodeResult) {
    const coords: [number, number] = [result.lat, result.lng]
    setPosition(coords)
    setFlyTo(coords)
    setDireccion(result.displayName)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    addFiles(Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/')))
  }

  function removePendingImage(index: number) {
    setPendingImages((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    event.preventDefault()

    if (!isNombreValid) {
      const message = 'Ingresa el nombre del centro'
      setNombreError(message)
      setError(message)
      nombreInputRef.current?.focus()
      scrollToFeedback(nombreInputRef.current?.closest('section') ?? null)
      return
    }
    setNombreError(null)
    if (!position) {
      setError('Marca tu ubicación en el mapa')
      scrollToFeedback(ubicacionSectionRef.current)
      return
    }

    const incomplete = suministros.filter((item) => item.articulos.length === 0)
    if (incomplete.length > 0) {
      setError(
        `Agrega artículos en: ${incomplete.map((item) => item.categoria).join(', ')}`,
      )
      scrollToFeedback(submitBarRef.current)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const centro = await createCentro({
        nombre: nombre.trim(),
        lat: position[0],
        lng: position[1],
        direccion: direccion.trim(),
        telefonos: cleanContactList(telefonos),
        correosContacto: cleanContactList(correosContacto),
        sitiosWeb: cleanContactList(sitiosWeb),
        tipoLugar,
        prioridad,
        suministrosNecesarios: suministros.map((item) => ({
          categoria: item.categoria,
          articulos: item.articulos.map((articulo) => articulo.trim()).filter(Boolean),
        })),
      })

      if (pendingImages.length > 0) {
        await uploadCentroImagenesPublic(centro._id, pendingImages)
      }

      setCreated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el centro')
      scrollToFeedback(submitBarRef.current)
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="crear-page">
        <section className="card crear-success-card">
          <img src="/logo.png" alt="" className="crear-success-logo" width={72} height={72} />
          <h1>¡Centro publicado!</h1>
          <p className="crear-hero-sub">
            Tu centro ya está en el mapa nacional. Las personas podrán ver qué suministros
            necesitas y cómo contactarte.
          </p>
          <Link to="/mapa" className="btn-save">
            Ver en el mapa
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="crear-page">
      <header className="crear-hero crear-hero-compact">
        <div className="crear-hero-copy">
          <h1>Publica tu centro en el mapa</h1>
          <p className="crear-hero-sub">Gratis y sin registro — visible en minutos.</p>
        </div>
        <img src="/logo.png" alt="" className="crear-hero-logo" width={80} height={80} />
      </header>

      <form className="crear-form dashboard-form" onSubmit={handleSubmit}>
        <ul className="crear-checklist" aria-label="Requisitos para publicar">
          <li className={isNombreValid ? 'done' : 'pending'}>
            <span className="crear-check-icon" aria-hidden="true">
              {isNombreValid ? '✓' : '○'}
            </span>
            Nombre del centro
          </li>
          <li className={position ? 'done' : 'pending'}>
            <span className="crear-check-icon" aria-hidden="true">
              {position ? '✓' : '○'}
            </span>
            Ubicación en el mapa
          </li>
          <li className={hasSuministros ? 'done optional' : 'optional'}>
            <span className="crear-check-icon" aria-hidden="true">
              {hasSuministros ? '✓' : '·'}
            </span>
            Suministros <span className="checklist-tag">recomendado</span>
          </li>
        </ul>

        <div className="crear-grid">
          <section className="card crear-card">
            <h2 className="crear-card-title">
              <span className="crear-step">1</span>
              Tu centro
            </h2>
            <label className="crear-field">
              <span>
                Nombre <span className="required-mark">*</span>
              </span>
              <input
                ref={nombreInputRef}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (nombreError) setNombreError(null)
                  if (error?.includes('nombre')) setError(null)
                }}
                placeholder="Ej: Centro comunitario Norte"
                required
                aria-required="true"
                aria-invalid={nombreError ? true : undefined}
              />
              {nombreError && <p className="error">{nombreError}</p>}
            </label>

            <label className="crear-field">
              <span>Tipo de establecimiento</span>
              <select
                value={tipoLugar}
                onChange={(e) => setTipoLugar(e.target.value as TipoLugarId)}
              >
                {TIPOS_LUGAR.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="crear-field">
              <span>
                Prioridad de necesidad <span className="required-mark">*</span>
              </span>
              <div className="prioridad-picker" role="radiogroup" aria-label="Prioridad de necesidad">
                {PRIORIDADES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={prioridad === item.id}
                    className={`prioridad-option prioridad-option-${item.id} ${prioridad === item.id ? 'selected' : ''}`}
                    style={
                      {
                        '--prioridad-color': item.color,
                        '--prioridad-light': item.light,
                      } as CSSProperties
                    }
                    onClick={() => setPrioridad(item.id)}
                  >
                    <span className="prioridad-option-dot" aria-hidden="true" />
                    <span className="prioridad-option-label">{item.label}</span>
                    <span className="prioridad-option-hint">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="card crear-card">
            <h2 className="crear-card-title">
              <span className="crear-step">2</span>
              Fotos
              <span className="badge-optional">Opcional</span>
            </h2>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              hidden
              onChange={handleFileChange}
            />
            <div
              className={`crear-dropzone ${dragOver ? 'drag-over' : ''} ${pendingImages.length >= MAX_IMAGES ? 'disabled' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => pendingImages.length < MAX_IMAGES && inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span className="crear-dropzone-icon" aria-hidden="true">
                📷
              </span>
              <strong>Arrastra fotos aquí</strong>
              <span>o haz clic para elegir</span>
              <span className="crear-dropzone-meta">
                JPG, PNG, WEBP o GIF · máx. 5 MB · {pendingImages.length}/{MAX_IMAGES}
              </span>
            </div>
            {previewUrls.length > 0 && (
              <ul className="centro-imagenes-grid crear-imagenes-grid">
                {previewUrls.map((url, index) => (
                  <li key={url} className={`centro-imagen-item ${index === 0 ? 'principal' : ''}`}>
                    <img src={url} alt="" />
                    {index === 0 && <span className="centro-imagen-badge">Principal</span>}
                    <div className="centro-imagen-actions">
                      <button
                        type="button"
                        className="danger"
                        disabled={submitting}
                        onClick={(e) => {
                          e.stopPropagation()
                          removePendingImage(index)
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section ref={ubicacionSectionRef} className="card crear-card crear-grid-full">
            <h2 className="crear-card-title">
              <span className="crear-step">3</span>
              Ubicación <span className="required-mark">*</span>
            </h2>
            <AddressSearch
              value={direccion}
              onChange={setDireccion}
              onSelect={handleAddressSelect}
              showHint={!position}
            />
            {position ? (
              <p className="crear-map-ok" role="status">
                ✓ Ubicación marcada
                {direccion.trim() && (
                  <span className="crear-map-ok-detail"> — {direccion.trim()}</span>
                )}
              </p>
            ) : (
              <p className="crear-map-hint" role="status">
                Busca tu dirección o haz clic en el mapa
              </p>
            )}
            <div className={`crear-map-wrap ${position ? 'has-marker' : ''}`}>
              <MapPicker
                position={position}
                onPositionChange={setPosition}
                flyTo={flyTo}
                tipoLugar={tipoLugar}
                prioridad={prioridad}
                height="400px"
              />
            </div>
          </section>

          <section className="card crear-card crear-grid-full">
            <details className="crear-contact-details" open>
              <summary className="crear-card-title crear-details-summary">
                <span className="crear-step">4</span>
                Contacto
                <span className="badge-optional">Opcional</span>
              </summary>
              <div className="contact-fields crear-contact-fields">
                <ContactListField
                  label="Teléfonos"
                  placeholder="Ej: +58 412 1234567"
                  values={telefonos}
                  onChange={setTelefonos}
                  type="tel"
                />
                <ContactListField
                  label="Correos"
                  placeholder="Ej: contacto@micentro.org"
                  values={correosContacto}
                  onChange={setCorreosContacto}
                  type="email"
                />
                <ContactListField
                  label="Sitios web"
                  placeholder="Ej: www.micentro.org"
                  values={sitiosWeb}
                  onChange={setSitiosWeb}
                  type="url"
                />
              </div>
            </details>
          </section>

          <section className="card crear-card crear-card-supplies">
            <h2 className="crear-card-title">
              <span className="crear-step">5</span>
              ¿Qué necesitas?
              <span className="badge-optional badge-recommended">Recomendado</span>
            </h2>
            <SuministrosPicker items={suministros} onChange={setSuministros} compact />
          </section>
        </div>

        <div ref={submitBarRef} className="crear-submit-bar save-actions">
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-save crear-submit-btn" disabled={submitting || !canSubmit}>
            {submitting ? 'Publicando...' : 'Publicar en el mapa'}
          </button>
        </div>
      </form>
    </div>
  )
}
