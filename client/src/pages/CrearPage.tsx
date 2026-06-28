import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { GeocodeResult } from '../api/geocode'
import { createCentro, uploadCentroImagenesPublic } from '../api/centros'
import { AddressSearch } from '../components/AddressSearch'
import { cleanContactList, ContactListField } from '../components/ContactListField'
import { MapPicker } from '../components/MapPicker'
import { SuministrosPicker } from '../components/SuministrosPicker'
import { DEFAULT_TIPO_LUGAR, TIPOS_LUGAR, type TipoLugarId } from '../constants/placeTypes'
import type { SuministroNecesario } from '../constants/supplies'

const MAX_IMAGES = 10
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

function getSubmitHint(nombre: string, position: [number, number] | null): string | null {
  if (!nombre.trim()) return 'Ingresa el nombre de tu centro'
  if (!position) return 'Marca tu ubicación en el mapa'
  return null
}

export function CrearPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const nombreInputRef = useRef<HTMLInputElement>(null)
  const [nombre, setNombre] = useState('')
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [direccion, setDireccion] = useState('')
  const [telefonos, setTelefonos] = useState<string[]>([''])
  const [correosContacto, setCorreosContacto] = useState<string[]>([''])
  const [sitiosWeb, setSitiosWeb] = useState<string[]>([''])
  const [tipoLugar, setTipoLugar] = useState<TipoLugarId>(DEFAULT_TIPO_LUGAR)
  const [suministros, setSuministros] = useState<SuministroNecesario[]>([])
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [contactOpen, setContactOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombreError, setNombreError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  const isNombreValid = nombre.trim().length > 0
  const canSubmit = isNombreValid && position !== null && !submitting
  const submitHint = getSubmitHint(nombre, position)

  const progress = useMemo(() => {
    let value = 0
    if (nombre.trim()) value += 35
    if (position) value += 35
    if (pendingImages.length > 0) value += 10
    if (suministros.length > 0) value += 20
    return value
  }, [nombre, position, pendingImages.length, suministros.length])

  useEffect(() => {
    const urls = pendingImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [pendingImages])

  function addImages(files: File[]) {
    if (files.length === 0) return
    setPendingImages((current) => {
      const combined = [...current, ...files]
      if (combined.length > MAX_IMAGES) {
        setError(`Máximo ${MAX_IMAGES} imágenes`)
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
    addImages(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    addImages(files)
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
      return
    }
    setNombreError(null)
    if (!position) {
      setError('Selecciona tu ubicación en el mapa')
      return
    }

    const incomplete = suministros.filter((item) => item.articulos.length === 0)
    if (incomplete.length > 0) {
      setError(
        `Agrega artículos en: ${incomplete.map((item) => item.categoria).join(', ')}`,
      )
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
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="crear-page">
        <section className="crear-success card">
          <img src="/logo.png" alt="" className="crear-success-logo" width={80} height={80} />
          <h1>¡Tu centro ya está en el mapa!</h1>
          <p className="crear-lead">
            Las personas en Venezuela pueden ver qué suministros necesitas y cómo contactarte.
          </p>
          <ul className="crear-trust-list crear-trust-list--vertical">
            <li>Visible en el mapa nacional de ayuda</li>
            <li>Comparte el enlace con tu comunidad</li>
            <li>Actualiza suministros cuando lo necesites</li>
          </ul>
          <Link to="/mapa" className="btn-save btn-save--large">
            Ver en el mapa
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="crear-page">
      <header className="crear-hero">
        <p className="crear-eyebrow">Red de Acopio Venezuela</p>
        <h1>Publica tu centro en el mapa</h1>
        <p className="crear-lead">
          Conecta con personas que quieren ayudar. Registra tu centro en minutos y muestra qué
          necesitas recibir.
        </p>
        <ul className="crear-trust-badges" aria-label="Beneficios">
          <li>✓ Gratis</li>
          <li>✓ Sin cuenta</li>
          <li>✓ Visible al instante</li>
        </ul>
        <div className="crear-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="crear-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="crear-progress-label">{progress}% completado</p>
      </header>

      <form className="crear-form dashboard-form" onSubmit={handleSubmit}>
        <section className="card crear-section">
          <div className="crear-section-head">
            <span className="crear-step">1</span>
            <div>
              <h2>Tu centro</h2>
              <p className="crear-section-desc">Nombre, tipo y fotos para que te reconozcan</p>
            </div>
          </div>

          <div className="crear-field-grid">
            <label className="crear-field crear-field--wide">
              <span className="crear-label">
                Nombre del centro <span className="required">*</span>
              </span>
              <input
                ref={nombreInputRef}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (nombreError) setNombreError(null)
                }}
                placeholder="Ej: Centro comunitario Norte"
                required
                aria-required="true"
                aria-invalid={nombreError ? true : undefined}
              />
              {nombreError && <p className="error crear-field-error">{nombreError}</p>}
            </label>

            <label className="crear-field">
              <span className="crear-label">Tipo de establecimiento</span>
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
          </div>

          <div
            className={`crear-dropzone ${dragOver ? 'crear-dropzone--active' : ''} ${pendingImages.length >= MAX_IMAGES ? 'crear-dropzone--disabled' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              if (pendingImages.length < MAX_IMAGES) setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => pendingImages.length < MAX_IMAGES && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Subir imágenes del centro"
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              hidden
              onChange={handleFileChange}
            />
            <span className="crear-dropzone-icon" aria-hidden="true">
              📷
            </span>
            <strong>
              {pendingImages.length >= MAX_IMAGES
                ? `Límite de ${MAX_IMAGES} imágenes alcanzado`
                : 'Arrastra fotos aquí o haz clic'}
            </strong>
            <span className="crear-dropzone-hint">
              JPG, PNG, WEBP o GIF · máx. 5 MB · {pendingImages.length}/{MAX_IMAGES}
            </span>
          </div>

          {previewUrls.length > 0 && (
            <ul className="centro-imagenes-grid">
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

        <section className="card crear-section">
          <div className="crear-section-head">
            <span className="crear-step">2</span>
            <div>
              <h2>Ubicación</h2>
              <p className="crear-section-desc">Para que las personas sepan dónde encontrarte</p>
            </div>
          </div>

          <AddressSearch
            value={direccion}
            onChange={setDireccion}
            onSelect={handleAddressSelect}
          />

          {!position && (
            <p className="crear-map-hint" role="status">
              📍 Busca tu dirección o haz clic en el mapa para marcar tu centro
            </p>
          )}

          <div className={`crear-map-wrap ${position ? 'crear-map-wrap--placed' : ''}`}>
            <MapPicker
              position={position}
              onPositionChange={setPosition}
              flyTo={flyTo}
              tipoLugar={tipoLugar}
              height="420px"
            />
          </div>
        </section>

        <section className="card crear-section">
          <div className="crear-section-head">
            <span className="crear-step">3</span>
            <div>
              <h2>¿Qué necesitas recibir?</h2>
              <p className="crear-section-desc">
                Opcional, pero ayuda mucho a quien quiera colaborar
              </p>
            </div>
          </div>
          <SuministrosPicker items={suministros} onChange={setSuministros} />
        </section>

        <section className="card crear-section crear-contact-section">
          <button
            type="button"
            className="crear-contact-toggle"
            onClick={() => setContactOpen((open) => !open)}
            aria-expanded={contactOpen}
          >
            <span>
              <strong>Información de contacto</strong>
              <span className="crear-optional">Opcional</span>
            </span>
            <span className="crear-contact-chevron" aria-hidden="true">
              {contactOpen ? '▲' : '▼'}
            </span>
          </button>

          {contactOpen && (
            <div className="contact-fields crear-contact-fields">
              <ContactListField
                label="Teléfonos"
                placeholder="Ej: +58 412 1234567"
                values={telefonos}
                onChange={setTelefonos}
                type="tel"
              />
              <ContactListField
                label="Correos de contacto"
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
          )}
        </section>

        <div className="crear-submit-bar">
          <div className="crear-submit-inner">
            {error && <p className="error crear-submit-error">{error}</p>}
            {!error && submitHint && <p className="crear-submit-hint">{submitHint}</p>}
            {!error && !submitHint && (
              <p className="crear-submit-ready">✓ Listo para publicar en el mapa</p>
            )}
            <button type="submit" className="btn-save btn-save--large" disabled={!canSubmit}>
              {submitting ? 'Publicando...' : 'Publicar en el mapa'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
