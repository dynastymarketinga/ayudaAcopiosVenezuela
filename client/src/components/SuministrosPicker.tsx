import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SUMINISTROS,
  SUMINISTRO_ICONS,
  SUMINISTRO_PLACEHOLDERS,
  type Suministro,
  type SuministroNecesario,
} from '../constants/supplies'

interface SuministrosPickerProps {
  items: SuministroNecesario[]
  onChange: (next: SuministroNecesario[]) => void
  onPersist?: (next: SuministroNecesario[]) => Promise<void>
}

function sortSuministros(items: SuministroNecesario[]) {
  return [...items].sort(
    (a, b) => SUMINISTROS.indexOf(a.categoria) - SUMINISTROS.indexOf(b.categoria),
  )
}

export function SuministrosPicker({ items, onChange, onPersist }: SuministrosPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeCategory, setActiveCategory] = useState<Suministro | null>(null)
  const [draftDetalle, setDraftDetalle] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [persisting, setPersisting] = useState(false)

  const selectedCategories = new Set(items.map((item) => item.categoria))
  const count = items.length

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activeCategory) {
      if (!dialog.open) dialog.showModal()
      textareaRef.current?.focus()
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
    setDraftDetalle(existing?.detalle ?? '')
    setDialogError(null)
  }

  function closeDialog() {
    setActiveCategory(null)
    setDraftDetalle('')
    setDialogError(null)
  }

  async function handleConfirm() {
    if (!activeCategory) return

    const detalle = draftDetalle.trim()
    if (!detalle) {
      setDialogError('Describe qué artículos necesitas de esta categoría')
      return
    }

    const next = sortSuministros([
      ...items.filter((item) => item.categoria !== activeCategory),
      { categoria: activeCategory, detalle },
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
            Indica exactamente qué artículos necesitas de esta categoría.
          </p>
          <label className="suministro-dialog-label">
            Detalle
            <textarea
              ref={textareaRef}
              value={draftDetalle}
              onChange={(event) => {
                setDraftDetalle(event.target.value)
                if (dialogError) setDialogError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault()
                  void handleConfirm()
                }
              }}
              placeholder={SUMINISTRO_PLACEHOLDERS[activeCategory]}
              rows={4}
            />
          </label>
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
                  ? 'Guardar detalle'
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
        <span className={`suministros-count ${count > 0 ? 'active' : ''}`}>
          {persisting
            ? 'Guardando...'
            : count === 0
              ? 'Ninguna categoría configurada'
              : `${count} categoría${count !== 1 ? 's' : ''} con detalle`}
        </span>
        <div className="suministros-toolbar-actions">
          <button
            type="button"
            className="btn-text"
            onClick={() => void clearAll()}
            disabled={count === 0 || persisting}
          >
            Limpiar todo
          </button>
        </div>
      </div>

      {count > 0 ? (
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
              <p className="suministro-detalle-text">{item.detalle}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="suministros-empty-hint">
          Elige una categoría y describe exactamente qué necesitas recibir.
        </p>
      )}

      <div className="suministros-grid" role="group" aria-label="Categorías de suministros">
        {SUMINISTROS.map((categoria) => {
          const isSelected = selectedCategories.has(categoria)

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
