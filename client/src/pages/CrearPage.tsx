import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombreError, setNombreError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  const isNombreValid = nombre.trim().length > 0

  useEffect(() => {
    const urls = pendingImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [pendingImages])

  function handleAddressSelect(result: GeocodeResult) {
    const coords: [number, number] = [result.lat, result.lng]
    setPosition(coords)
    setFlyTo(coords)
    setDireccion(result.displayName)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
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
      <div className="panel-dashboard">
        <section className="card">
          <h1>Centro creado</h1>
          <p className="panel-subtitle">
            Tu centro de acopio ya está publicado en el mapa. Las personas podrán ver qué
            suministros necesitas.
          </p>
          <Link to="/mapa" className="btn-save">
            Ver en el mapa
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="panel-dashboard">
      <header className="panel-header">
        <div>
          <h1>Crear centro de acopio</h1>
          <p className="panel-subtitle">
            Completa la información de tu centro para publicarlo en el mapa.
          </p>
        </div>
      </header>

      <form className="dashboard-form" onSubmit={handleSubmit}>
        <section className="card">
          <h2>Nombre del centro</h2>
          <p className="panel-subtitle">
            Este es el nombre con el que aparecerá tu centro en el mapa y en las búsquedas.
          </p>
          <label>
            Nombre (obligatorio)
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
            {nombreError && <p className="error">{nombreError}</p>}
          </label>
        </section>

        <section className="card">
          <h2>Imágenes del centro</h2>
          <p className="panel-subtitle">
            Sube fotos de tu centro. La primera imagen se usará como foto principal en el mapa.
          </p>
          <div className="centro-imagenes-upload">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={submitting || pendingImages.length >= MAX_IMAGES}
              onClick={() => inputRef.current?.click()}
            >
              {pendingImages.length >= MAX_IMAGES
                ? `Límite de ${MAX_IMAGES} imágenes`
                : 'Subir imágenes'}
            </button>
            <span className="centro-imagenes-hint">
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
                      onClick={() => removePendingImage(index)}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Tipo de lugar</h2>
          <p className="panel-subtitle">
            Indica qué tipo de establecimiento es tu centro para mostrarlo con el icono correcto en el mapa.
          </p>
          <label>
            Categoría
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
        </section>

        <section className="card">
          <h2>Ubicación</h2>
          <p className="panel-subtitle">
            Busca tu dirección o haz clic en el mapa para marcar la ubicación de tu centro.
          </p>
          <AddressSearch
            value={direccion}
            onChange={setDireccion}
            onSelect={handleAddressSelect}
          />
          <div className="mt-1">
            <MapPicker
              position={position}
              onPositionChange={setPosition}
              flyTo={flyTo}
              tipoLugar={tipoLugar}
              height="360px"
            />
          </div>
        </section>

        <section className="card">
          <h2>Información de contacto</h2>
          <p className="panel-subtitle">
            Agrega teléfonos, correos y sitios web para que las personas puedan comunicarse contigo.
          </p>

          <div className="contact-fields">
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
        </section>

        <section className="card">
          <h2>Suministros necesarios</h2>
          <p className="panel-subtitle">
            Indica qué artículos necesita recibir tu centro. Aparecerán en el mapa para quienes quieran
            ayudar.
          </p>
          <SuministrosPicker items={suministros} onChange={setSuministros} />
        </section>

        <div className="save-actions">
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-save" disabled={submitting || !isNombreValid}>
            {submitting ? 'Creando...' : 'Crear centro de acopio'}
          </button>
        </div>
      </form>
    </div>
  )
}
