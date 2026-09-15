import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

/**
 * usePageTitle — syncs document.title with the active route.
 * Route titles live in the route table (src/routes.jsx) as { ur, en } pairs.
 * Usage (Layout.jsx): usePageTitle(routes)
 */
export function usePageTitle(routeTable = []) {
  const { pathname } = useLocation()
  const { lang, t } = useLanguage()

  useEffect(() => {
    const match = routeTable.find((route) => route.path === pathname)
    const pageTitle = match?.title?.[lang] ?? t('appName')
    document.title = `${pageTitle} — ${t('appName')}`
  }, [pathname, lang, routeTable, t])
}

export default usePageTitle
