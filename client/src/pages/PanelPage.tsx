import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  adminLogin,
  clearAdminToken,
  deleteCentro,
  fetchAdminCentros,
  getAdminToken,
  setAdminToken,
} from '../api/admin'
import type { Centro } from '../api/centros'
import { getTipoLugarLabel } from '../constants/placeTypes'

function AdminLoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { token } = await adminLogin({ email, password })
      setAdminToken(token)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-admin-login">
      <h1>Panel de administración</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

function CentroItem({
  centro,
  onDelete,
}: {
  centro: Centro
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${centro.nombre}"?`)) return

    setDeleting(true)
    try {
      await onDelete(centro._id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar')
      setDeleting(false)
    }
  }

  return (
    <li className="panel-centro-item">
      <div>
        <strong>{centro.nombre}</strong>
        <p>{getTipoLugarLabel(centro.tipoLugar)}</p>
        {centro.direccion && <p>{centro.direccion}</p>}
        {centro.telefonos.length > 0 && <p>Tel: {centro.telefonos.join(', ')}</p>}
      </div>
      <button type="button" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Eliminando...' : 'Eliminar'}
      </button>
    </li>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [centros, setCentros] = useState<Centro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCentros = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminCentros()
      setCentros(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los centros'
      if (message === 'No autorizado' || message === 'Token inválido o expirado') {
        clearAdminToken()
        onLogout()
        return
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    loadCentros()
  }, [loadCentros])

  async function handleDelete(id: string) {
    await deleteCentro(id)
    setCentros((current) => current.filter((c) => c._id !== id))
  }

  function handleLogout() {
    clearAdminToken()
    onLogout()
  }

  return (
    <div className="panel-admin">
      <header className="panel-admin-header">
        <h1>Centros de acopio</h1>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && centros.length === 0 && (
        <p>No hay centros de acopio registrados.</p>
      )}

      {!loading && centros.length > 0 && (
        <ul className="panel-centros-list">
          {centros.map((centro) => (
            <CentroItem key={centro._id} centro={centro} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  )
}

export function PanelPage() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAdminToken()))

  return (
    <div className="panel-page">
      {authenticated ? (
        <AdminDashboard onLogout={() => setAuthenticated(false)} />
      ) : (
        <AdminLoginForm onLogin={() => setAuthenticated(true)} />
      )}
    </div>
  )
}
