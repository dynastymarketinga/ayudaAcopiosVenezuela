import {
  SUMINISTRO_ICONS,
  type SuministroNecesario,
  type Suministro,
} from '../constants/supplies'

interface SuministrosDisplayProps {
  items: SuministroNecesario[]
  compact?: boolean
}

export function SuministrosDisplay({ items, compact = false }: SuministrosDisplayProps) {
  if (items.length === 0) return null

  return (
    <div className={`suministros-display ${compact ? 'suministros-display-compact' : ''}`}>
      {items.map((item) => (
        <section key={item.categoria} className="suministros-display-group">
          <header className="suministros-display-group-header">
            <span className="suministros-display-group-icon" aria-hidden="true">
              {SUMINISTRO_ICONS[item.categoria as Suministro]}
            </span>
            <span className="suministros-display-group-title">{item.categoria}</span>
            <span className="suministros-display-group-count">
              {item.articulos.length} artículo{item.articulos.length !== 1 ? 's' : ''}
            </span>
          </header>
          <ul className="suministros-display-items">
            {item.articulos.map((articulo) => (
              <li key={articulo}>{articulo}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
