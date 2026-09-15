import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import Breadcrumbs from './Breadcrumbs.jsx'
import OfflineBanner from './OfflineBanner.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import ErrorBoundary from '../ErrorBoundary.jsx'
import PageLoader from '../States/PageLoader.jsx'
import InstallPrompt from '../PWA/InstallPrompt.jsx'
import UpdatePrompt from '../PWA/UpdatePrompt.jsx'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { routes } from '../../routes.jsx'

/**
 * Layout — app shell.
 *  - Header: sticky, deep blue, hamburger below lg (state in SidebarContext)
 *  - Sidebar: start-side (right in RTL) fixed on lg, drawer below
 *  - BottomNav: below md only
 *  - Content: max-width 1280px, centered, padded
 *  - Route-level ErrorBoundary + Suspense(PageLoader) around <Outlet/>
 *  - document.title synced via usePageTitle + route table
 *  - skip-to-content link for keyboard/screen-reader users
 */
export default function Layout() {
  const { t } = useLanguage()
  usePageTitle(routes)

  return (
    <div className="min-h-screen">
      <ScrollToTop />

      <a href="#main-content" className="skip-link">
        {t('common.skipToContent')}
      </a>

      <Sidebar />

      <div className="flex min-h-screen flex-col lg:ps-72">
        <Header />
        <OfflineBanner />

        <main id="main-content" className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-10">
          <Breadcrumbs />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader label={t('states.loading')} />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <BottomNav />
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  )
}
