import { useRef, useState, type ChangeEvent } from 'react'
import {
  deleteCentroImagen,
  setImagenPrincipal,
  uploadCentroImagenes,
  type Centro,
} from '../api/centros'

const MAX_IMAGES = 10
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

interface CentroImagenesSectionProps {
  centro: Centro
  onUpdated: () => void | Promise<void>
}

export function CentroImagenesSection({ centro, onUpdated }: CentroImagenesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [busyUrl, setBusyUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const imagenes = centro.imagenes ?? []
  const canUploadMore = imagenes.length < MAX_IMAGES

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) return

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      await uploadCentroImagenes(files)
      await onUpdated()
      setMessage(
        files.length === 1 ? 'Imagen subida correctamente' : `${files.length} imágenes subidas`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron subir las imágenes')
    } finally {
      setUploading(false)
    }
  }

  async function handleSetPrincipal(url: string) {
    setBusyUrl(url)
    setError(null)
    setMessage(null)

    try {
      await setImagenPrincipal(url)
      await onUpdated()
      setMessage('Imagen principal actualizada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la imagen principal')
    } finally {
      setBusyUrl(null)
    }
  }

  async function handleDelete(url: string) {
    setBusyUrl(url)
    setError(null)
    setMessage(null)

    try {
      await deleteCentroImagen(url)
      await onUpdated()
      setMessage('Imagen eliminada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la imagen')
    } finally {
      setBusyUrl(null)
    }
  }

  return (
    <section className="card">
      <h2>Imágenes del centro</h2>
      <p className="panel-subtitle">
        Sube fotos de tu centro y elige una imagen principal. Esa foto se mostrará en el mapa al
        expandir la información.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

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
          disabled={uploading || !canUploadMore}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? 'Subiendo...'
            : canUploadMore
              ? 'Subir imágenes'
              : `Límite de ${MAX_IMAGES} imágenes`}
        </button>
        <span className="centro-imagenes-hint">
          JPG, PNG, WEBP o GIF · máx. 5 MB · {imagenes.length}/{MAX_IMAGES}
        </span>
      </div>

      {imagenes.length > 0 ? (
        <ul className="centro-imagenes-grid">
          {imagenes.map((url) => {
            const isPrincipal = centro.imagenPrincipal === url
            const isBusy = busyUrl === url

            return (
              <li key={url} className={`centro-imagen-item ${isPrincipal ? 'principal' : ''}`}>
                <img src={url} alt="" loading="lazy" />
                {isPrincipal && <span className="centro-imagen-badge">Principal</span>}
                <div className="centro-imagen-actions">
                  {!isPrincipal && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPrincipal(url)}
                    >
                      Hacer principal
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    disabled={isBusy}
                    onClick={() => handleDelete(url)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="empty">Aún no has subido imágenes.</p>
      )}
    </section>
  )
}
