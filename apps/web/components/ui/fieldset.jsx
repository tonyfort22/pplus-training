export default function Fieldset({ children = null, description = '', legend = '' }) {
  return (
    <fieldset className="ui-fieldset">
      {legend ? <legend className="ui-fieldset-legend">{legend}</legend> : null}
      {description ? <p className="ui-fieldset-description">{description}</p> : null}
      <div className="ui-fieldset-body">{children}</div>
    </fieldset>
  )
}
