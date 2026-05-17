export default function Checkbox({ className = '', label = '', ...props }) {
  const control = <input type="checkbox" className={['ui-checkbox', className].filter(Boolean).join(' ')} {...props} />

  if (!label) return control

  return (
    <label className="ui-choice-field">
      {control}
      <span>{label}</span>
    </label>
  )
}
