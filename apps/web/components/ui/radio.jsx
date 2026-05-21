export default function Radio({ className = '', label = '', ...props }) {
  const control = <input type="radio" className={['ui-radio', className].filter(Boolean).join(' ')} {...props} />

  if (!label) return control

  return (
    <label className="ui-choice-field">
      {control}
      <span>{label}</span>
    </label>
  )
}
