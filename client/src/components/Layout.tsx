import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className={`layout ${menuOpen ? 'nav-open' : ''}`}>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          Help Acopio
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
          <NavLink to="/panel" className={({ isActive }) => (isActive ? 'active' : '')}>
            Panel de centros
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
