interface ContactListFieldProps {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
  type?: 'text' | 'email' | 'url' | 'tel'
}

export function ContactListField({
  label,
  placeholder,
  values,
  onChange,
  type = 'text',
}: ContactListFieldProps) {
  function updateValue(index: number, value: string) {
    onChange(values.map((item, i) => (i === index ? value : item)))
  }

  function addField() {
    onChange([...values, ''])
  }

  function removeField(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  const items = values.length > 0 ? values : ['']

  return (
    <div className="contact-list-field">
      <div className="contact-list-header">
        <span>{label}</span>
        <button type="button" className="btn-add-field" onClick={addField}>
          + Agregar
        </button>
      </div>

      <div className="contact-list-items">
        {items.map((value, index) => (
          <div key={index} className="contact-list-row">
            <input
              type={type}
              value={value}
              onChange={(e) => updateValue(index, e.target.value)}
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <button
                type="button"
                className="btn-remove-field"
                onClick={() => removeField(index)}
                aria-label={`Eliminar ${label.toLowerCase()}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function cleanContactList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}
