import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SUMINISTROS,
  SUMINISTRO_ICONS,
  SUMINISTRO_ITEM_PLACEHOLDERS,
  countArticulos,
  type Suministro,
  type SuministroNecesario,
} from '../constants/supplies'
import { ContactListField, cleanContactList } from './ContactListField'

interface SuministrosPickerProps {
  items: SuministroNecesario[]
  onChange: (next: SuministroNecesario[]) => void
  onPersist?: (next: SuministroNecesario[]) => Promise<void>
  compact?: boolean
}

function sortSuministros(items: SuministroNecesario[]) {
  return [...items].sort(
    (a, b) => SUMINISTROS.indexOf(a.categoria) - SUMINISTROS.indexOf(b.categoria),
  )
}

export function SuministrosPicker({ items, onChange, onPersist, compact = false }: SuministrosPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeCategory, setActiveCategory] = useState<Suministro | null>(null)
  const [draftArticulos, setDraftArticulos] = useState<string[]>([''])
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [persisting, setPersisting] = useState(false)

  const selectedCategories = new Set(items.map((item) => item.categoria))
  const categoryCount = items.length
  const articulosCount = countArticulos(items)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activeCategory) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [activeCategory])

  async function applyChange(next: SuministroNecesario[]) {
    onChange(next)
    if (!onPersist) return

    setPersisting(true)
    try {
      await onPersist(next)
    } finally {
      setPersisting(false)
    }
  }

  function openDialog(categoria: Suministro) {
    const existing = items.find((item) => item.categoria === categoria)
    setActiveCategory(categoria)
    setDraftArticulos(existing?.articulos.length ? existing.articulos : [''])
    setDialogError(null)
  }

  function closeDialog() {
    setActiveCategory(null)
    setDraftArticulos([''])
    setDialogError(null)
  }

  async function handleConfirm() {
    if (!activeCategory) return

    const articulos = cleanContactList(draftArticulos)
    if (articulos.length === 0) {
      setDialogError('Agrega al menos un artículo para esta categoría')
      return
    }

    const next = sortSuministros([
      ...items.filter((item) => item.categoria !== activeCategory),
      { categoria: activeCategory, articulos },
    ])

    try {
      await applyChange(next)
      closeDialog()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  async function handleRemove(categoria: Suministro) {
    const next = items.filter((item) => item.categoria !== categoria)
    try {
      await applyChange(next)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  async function clearAll() {
    try {
      await applyChange([])
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  const dialog = (
    <dialog
      ref={dialogRef}
      className="suministro-dialog"
      onClose={closeDialog}
      onCancel={closeDialog}
    >
      {activeCategory && (
        <div className="suministro-dialog-form">
          <div className="suministro-dialog-header">
            <h3>
              <span aria-hidden="true">{SUMINISTRO_ICONS[activeCategory]}</span>
              {activeCategory}
            </h3>
            <button type="button" className="suministro-dialog-close" onClick={closeDialog}>
              ×
            </button>
          </div>
          <p className="suministro-dialog-subtitle">
            Agrega cada artículo que necesitas en esta categoría. Puedes añadir varios.
          </p>
          <ContactListField
            label="Artículos necesarios"
            placeholder={SUMINISTRO_ITEM_PLACEHOLDERS[activeCategory]}
            values={draftArticulos}
            onChange={(values) => {
              setDraftArticulos(values)
              if (dialogError) setDialogError(null)
            }}
          />
          {dialogError && <p className="error">{dialogError}</p>}
          <div className="suministro-dialog-actions">
            <button type="button" className="btn-secondary" onClick={closeDialog}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-save"
              disabled={persisting}
              onClick={() => void handleConfirm()}
            >
              {persisting
                ? 'Guardando...'
                : selectedCategories.has(activeCategory)
                  ? 'Guardar artículos'
                  : 'Agregar categoría'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )

  return (
    <div className="suministros-picker">
      <div className="suministros-toolbar">
        <span className={`suministros-count ${categoryCount > 0 ? 'active' : ''}`}>
          {persisting
            ? 'Guardando...'
            : categoryCount === 0
              ? compact
                ? 'Toca una categoría abajo'
                : 'Ninguna categoría configurada'
              : `${categoryCount} categoría${categoryCount !== 1 ? 's' : ''} · ${articulosCount} artículo${articulosCount !== 1 ? 's' : ''}`}
        </span>
        <div className="suministros-toolbar-actions">
          <button
            type="button"
            className="btn-text"
            onClick={() => void clearAll()}
            disabled={categoryCount === 0 || persisting}
          >
            Limpiar todo
          </button>
        </div>
      </div>

      {categoryCount > 0 ? (
        <ul className="suministros-detalle-list" aria-label="Suministros configurados">
          {items.map((item) => (
            <li key={item.categoria} className="suministro-detalle-card">
              <div className="suministro-detalle-header">
                <span className="suministro-detalle-title">
                  <span aria-hidden="true">{SUMINISTRO_ICONS[item.categoria]}</span>
                  {item.categoria}
                </span>
                <div className="suministro-detalle-actions">
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => openDialog(item.categoria)}
                    disabled={persisting}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-text danger"
                    onClick={() => void handleRemove(item.categoria)}
                    disabled={persisting}
                  >
                    Quitar
                  </button>
                </div>
              </div>
              <ul className="suministro-articulos-preview">
                {item.articulos.map((articulo) => (
                  <li key={articulo}>{articulo}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        !compact && (
          <p className="suministros-empty-hint">
            Elige una categoría y agrega los artículos que necesitas recibir.
          </p>
        )
      )}

      <div className="suministros-grid" role="group" aria-label="Categorías de suministros">
        {SUMINISTROS.map((categoria) => {
          const isSelected = selectedCategories.has(categoria)
          const item = items.find((entry) => entry.categoria === categoria)

          return (
            <button
              key={categoria}
              type="button"
              className={`suministro-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => openDialog(categoria)}
              aria-pressed={isSelected}
              disabled={persisting}
            >
              <span className="suministro-chip-icon" aria-hidden="true">
                {SUMINISTRO_ICONS[categoria]}
              </span>
              <span className="suministro-chip-label">{categoria}</span>
              {isSelected && item && (
                <span className="suministro-chip-meta">
                  {item.articulos.length} artículo{item.articulos.length !== 1 ? 's' : ''}
                </span>
              )}
              <span className="suministro-chip-check" aria-hidden="true">
                {isSelected ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </div>

      {createPortal(dialog, document.body)}
    </div>
  )
}
