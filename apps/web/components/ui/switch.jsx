'use client'

export default function Switch({
  checked = false,
  className = '',
  label = '',
  onCheckedChange,
  onChange,
  ...props
}) {
  const handleClick = () => {
    const next = !checked
    onCheckedChange?.(next)
    onChange?.(next)
  }

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-pressed={checked}
      data-checked={checked ? 'true' : 'false'}
      className={['ui-switch', checked ? 'ui-switch-checked' : '', className].filter(Boolean).join(' ')}
      onClick={handleClick}
      {...props}
    >
      <span className="ui-switch-thumb" />
    </button>
  )

  if (!label) return control

  return (
    <label className="ui-choice-field">
      {control}
      <span>{label}</span>
    </label>
  )
}
