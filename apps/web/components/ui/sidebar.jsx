import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'

function normalizeLegacyItems(items = []) {
  if (!items.length) return []

  const defaultHref = items.find((item) => item.current)?.href || items[0]?.href || ''

  return [
    {
      id: 'navigation',
      label: 'Navigation',
      expanded: true,
      href: defaultHref,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href || '',
        current: item.current,
      })),
    },
  ]
}

function isPathActive(currentPath = '', href = '') {
  if (!href) return false
  return currentPath === href || currentPath.startsWith(`${href}/`)
}

function SidebarGroup({ currentPath = '', group, secondary = false }) {
  const groupHref = group.href || group.defaultHref || group.items?.[0]?.href || '/'
  const hasActiveChild = group.items?.some((item) => currentPath === item.href)
  const isActive = group.current || isPathActive(currentPath, groupHref) || hasActiveChild
  const isExpanded = isActive

  return (
    <div className={['ui-sidebar-group', secondary ? 'ui-sidebar-group-secondary' : ''].filter(Boolean).join(' ')}>
      <Link
        href={groupHref}
        className={[
          'ui-sidebar-item',
          'ui-sidebar-group-button',
          isActive ? 'ui-sidebar-group-button-current' : '',
        ].filter(Boolean).join(' ')}
      >
        {group.icon ? <span className="ui-sidebar-item-icon ui-sidebar-group-icon">{group.icon}</span> : <span className="ui-sidebar-group-spacer" />}
        <span className="ui-sidebar-group-label">{group.label}</span>
        <ChevronRight className={['ui-sidebar-group-chevron', isExpanded ? 'ui-sidebar-group-chevron-expanded' : ''].filter(Boolean).join(' ')} />
      </Link>

      {isExpanded && group.items?.length ? (
        <div className="ui-sidebar-subnav">
          {group.items.map((item) => {
            const itemHref = item.href || groupHref
            const itemCurrent = item.current || currentPath === itemHref

            return (
              <Link
                key={item.id}
                href={itemHref}
                className={['ui-sidebar-subitem', itemCurrent ? 'ui-sidebar-subitem-current' : ''].filter(Boolean).join(' ')}
              >
                <span className="ui-sidebar-subitem-label">{item.label}</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default function Sidebar({
  bottomSections = [],
  brandLogoAlt = '',
  brandLogoSrc = '',
  brandMark = '',
  currentPath = '',
  footer = null,
  items = [],
  searchPlaceholder = '',
  sections = [],
  subtitle = '',
  title = '',
}) {
  const topSections = sections.length ? sections : normalizeLegacyItems(items)
  const computedBrandMark = brandMark || title.slice(0, 2) || 'UI'

  return (
    <aside className="ui-sidebar">
      <div className="ui-sidebar-header ui-sidebar-brand-lockup">
        {brandLogoSrc ? (
          <img className="ui-sidebar-logo" src={brandLogoSrc} alt={brandLogoAlt || title || 'Sidebar logo'} />
        ) : (
          <div className="ui-sidebar-wordmark">
            <strong className="ui-sidebar-wordmark-mark">{computedBrandMark}</strong>
            <span className="ui-sidebar-wordmark-text">{title}</span>
          </div>
        )}
        {subtitle ? <span className="ui-sidebar-subtitle">{subtitle}</span> : null}
      </div>

      {searchPlaceholder ? (
        <div className="ui-sidebar-search-shell">
          <Search className="ui-sidebar-search-icon" />
          <input className="ui-sidebar-search" placeholder={searchPlaceholder} readOnly />
        </div>
      ) : null}

      <nav className="ui-sidebar-nav" aria-label={title || 'Sidebar'}>
        {topSections.map((group) => (
          <SidebarGroup key={group.id} group={group} currentPath={currentPath} />
        ))}
      </nav>

      {bottomSections.length ? <div className="ui-sidebar-divider" role="presentation" /> : null}

      {bottomSections.length ? (
        <div className="ui-sidebar-nav ui-sidebar-nav-secondary" aria-label="Sidebar secondary">
          {bottomSections.map((group) => (
            <SidebarGroup key={group.id} group={group} currentPath={currentPath} secondary />
          ))}
        </div>
      ) : null}

      {footer ? <div className="ui-sidebar-footer">{footer}</div> : null}
    </aside>
  )
}
