export default function DescriptionList({ items = [] }) {
  return (
    <dl className="ui-description-list">
      {items.map((item) => (
        <div key={item.term} className="ui-description-list-row">
          <dt className="ui-description-list-term">{item.term}</dt>
          <dd className="ui-description-list-detail">{item.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
