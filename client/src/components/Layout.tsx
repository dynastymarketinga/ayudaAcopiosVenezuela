import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isMapa = location.pathname === '/mapa'
  const isCrear = location.pathname === '/crear'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div
      className={`layout ${menuOpen ? 'nav-open' : ''} ${isMapa ? 'layout-mapa' : ''} ${isCrear ? 'layout-crear' : ''}`}
    >
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="" className="navbar-logo" width={36} height={36} />
          <span className="navbar-brand-text">
            <strong>Red de Acopio</strong>
            <small>Venezuela</small>
          </span>
        </NavLink>
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="navbar-links">
          <NavLink to="/mapa" className={({ isActive }) => (isActive ? 'active' : '')}>
            Mapa
          </NavLink>
          <NavLink to="/crear" className={({ isActive }) => (isActive ? 'active' : '')}>
            Registrar centro
          </NavLink>
        </div>
      </nav>
      {menuOpen && (
        <button
          type="button"
          className="navbar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <Outlet />
    </div>
  )
}
