import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { routes } from '../../routes.jsx'

/**
 * Breadcrumbs — bilingual trail built from the route table titles.
 * Hidden on the dashboard. Becomes more useful with nested pages later.
 */
export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const { pick } = useLanguage()

  if (pathname === '/') return null

  const crumbs = routes.filter(
    (route) => route.path !== '/' && route.title && pathname.startsWith(route.path)
  )
  if (crumbs.length === 0) return null

  return (
    <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-0.5 text-xs text-muted">
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors hover:text-primary dark:hover:text-primary-light"
      >
        <Home size={13} aria-hidden="true" />
        <span>{pick({ ur: 'ہوم', en: 'Home' })}</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="inline-flex items-center gap-0.5">
          <ChevronRight size={13} className="rtl:-scale-x-100" aria-hidden="true" />
          <Link
            to={crumb.path}
            className="rounded-lg px-1.5 py-1 transition-colors hover:text-primary dark:hover:text-primary-light"
          >
            {pick(crumb.title)}
          </Link>
        </span>
      ))}
    </nav>
  )
}
