import { useEffect, useState, type FormEvent } from 'react'
import type { GeocodeResult } from '../api/geocode'
import { updateCentro } from '../api/centros'
import { AddressSearch } from '../components/AddressSearch'
import { cleanContactList, ContactListField } from '../components/ContactListField'
import { MapPicker } from '../components/MapPicker'
import { CentroImagenesSection } from '../components/CentroImagenesSection'
import { SuministrosPicker } from '../components/SuministrosPicker'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_TIPO_LUGAR, TIPOS_LUGAR, type TipoLugarId } from '../constants/placeTypes'
import {
  normalizeSuministrosNecesarios,
  type SuministroNecesario,
} from '../constants/supplies'

type AuthMode = 'login' | 'register'

function AuthForm() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, nombre)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autenticar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-auth">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          Registrarse
        </button>
      </div>

      <div className="card">
        <h1>{mode === 'login' ? 'Acceso para centros' : 'Registrar centro de acopio'}</h1>
        <p className="panel-subtitle">
          {mode === 'login'
            ? 'Ingresa con tu correo para gestionar tu centro.'
            : 'Crea una cuenta para publicar qué suministros necesitas.'}
        </p>

        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Nombre del centro
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Centro comunitario Norte"
                required
              />
            </label>
          )}
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="centro@ejemplo.com"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CentroDashboard() {
  const { centro, logout, refreshCentro } = useAuth()
  const [nombre, setNombre] = useState('')
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [direccion, setDireccion] = useState('')
  const [telefonos, setTelefonos] = useState<string[]>([''])
  const [correosContacto, setCorreosContacto] = useState<string[]>([''])
  const [sitiosWeb, setSitiosWeb] = useState<string[]>([''])
  const [tipoLugar, setTipoLugar] = useState<TipoLugarId>(DEFAULT_TIPO_LUGAR)
  const [suministros, setSuministros] = useState<SuministroNecesario[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!centro) return
    if (typeof centro.lat === 'number' && typeof centro.lng === 'number') {
      setPosition([centro.lat, centro.lng])
    }
    setDireccion(centro.direccion ?? '')
    setNombre(centro.nombre ?? '')
    setTelefonos(centro.telefonos.length > 0 ? centro.telefonos : [''])
    setCorreosContacto(centro.correosContacto.length > 0 ? centro.correosContacto : [''])
    setSitiosWeb(centro.sitiosWeb.length > 0 ? centro.sitiosWeb : [''])
    setTipoLugar(centro.tipoLugar ?? DEFAULT_TIPO_LUGAR)
    setSuministros(normalizeSuministrosNecesarios(centro.suministrosNecesarios))
  }, [centro])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(timer)
  }, [message])

  function handleAddressSelect(result: GeocodeResult) {
    const coords: [number, number] = [result.lat, result.lng]
    setPosition(coords)
    setFlyTo(coords)
    setDireccion(result.displayName)
  }

  async function persistSuministros(next: SuministroNecesario[]) {
    const updated = await updateCentro({
      suministrosNecesarios: next.map((item) => ({
        categoria: item.categoria,
        detalle: item.detalle.trim(),
      })),
    })
    setSuministros(normalizeSuministrosNecesarios(updated.suministrosNecesarios))
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!nombre.trim()) {
      setError('Ingresa el nombre del centro')
      return
    }
    if (!position) {
      setError('Selecciona tu ubicación en el mapa')
      return
    }

    const incomplete = suministros.filter((item) => !item.detalle.trim())
    if (incomplete.length > 0) {
      setError(
        `Completa el detalle de: ${incomplete.map((item) => item.categoria).join(', ')}`,
      )
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await updateCentro({
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
          detalle: item.detalle.trim(),
        })),
      })
      await refreshCentro()
      setMessage('Cambios guardados correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel-dashboard">
      <header className="panel-header">
        <div>
          <h1>{centro?.nombre}</h1>
          <p className="panel-subtitle">{centro?.email}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <form className="dashboard-form" onSubmit={handleSave}>
        <section className="card">
          <h2>Nombre del centro</h2>
          <p className="panel-subtitle">
            Este es el nombre con el que aparecerá tu centro en el mapa y en las búsquedas.
          </p>
          <label>
            Nombre
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Centro comunitario Norte"
              required
            />
          </label>
        </section>

        {centro && <CentroImagenesSection centro={centro} onUpdated={refreshCentro} />}

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
          <SuministrosPicker
            items={suministros}
            onChange={setSuministros}
            onPersist={persistSuministros}
          />
        </section>

        <div className="save-actions">
          {error && <p className="error">{error}</p>}
          {message && <p className="success" role="status">{message}</p>}
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PanelPage() {
  const { centro, loading } = useAuth()

  if (loading) {
    return (
      <div className="panel-page">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="panel-page">
      {centro ? <CentroDashboard /> : <AuthForm />}
    </div>
  )
}
