import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Languages, LogOut, Moon, Sun } from 'lucide-react'
import Button from '../components/UI/Button.jsx'
import Card from '../components/UI/Card.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { Switch } from '../components/UI/Input.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'

/**
 * Settings (ترتیبات) — language toggle (Urdu/English), theme toggle
 * (light/dark), profile section and notification preferences.
 * All UI state only — nothing is sent anywhere.
 */
export default function Settings() {
  const { t, lang, setLang, theme, setTheme, isRTL } = useAppUI()
  const [notif, setNotif] = useState({ lowStock: true, orders: true, dailyReport: false })

  const Chevron = isRTL ? ChevronLeft : ChevronRight

  const notificationRows = [
    { id: 'lowStock', label: t('set.notifLowStock'), desc: t('set.notifLowStockDesc') },
    { id: 'orders', label: t('set.notifOrders'), desc: t('set.notifOrdersDesc') },
    { id: 'dailyReport', label: t('set.notifReport'), desc: t('set.notifReportDesc') },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={t('nav.settings')} en="Settings" subtitle={t('set.subtitle')} />

      {/* profile */}
      <Card>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-2xl font-bold text-white">
            م
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-main">{t('set.userName')}</p>
            <p className="mt-0.5 text-xs text-muted">{t('set.factoryManager')}</p>
          </div>
          <Button variant="outline" size="sm">
            {t('common.edit')}
          </Button>
        </div>
      </Card>

      {/* preferences: language + theme */}
      <Card title={t('set.preferences')}>
        <div className="space-y-5">
          {/* language */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Languages size={20} className="shrink-0 text-primary dark:text-primary-light" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-main">{t('set.language')}</p>
                <p className="text-xs text-muted">{lang === 'ur' ? 'اردو (RTL)' : 'English (LTR)'}</p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-secondary p-1 dark:bg-gray-700/50">
              <button type="button" onClick={() => setLang('ur')} className={segmented(lang === 'ur')}>
                اردو
              </button>
              <button type="button" onClick={() => setLang('en')} className={segmented(lang === 'en')}>
                English
              </button>
            </div>
          </div>

          <div className="border-t border-border dark:border-gray-700" />

          {/* theme */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={20} className="shrink-0 text-primary dark:text-primary-light" aria-hidden="true" />
              ) : (
                <Sun size={20} className="shrink-0 text-primary dark:text-primary-light" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold text-main">{t('set.theme')}</p>
                <p className="text-xs text-muted">
                  {theme === 'dark' ? t('set.dark') : t('set.light')}
                </p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-secondary p-1 dark:bg-gray-700/50">
              <button type="button" onClick={() => setTheme('light')} className={segmented(theme === 'light')}>
                <span className="inline-flex items-center gap-1.5">
                  <Sun size={14} />
                  {t('set.light')}
                </span>
              </button>
              <button type="button" onClick={() => setTheme('dark')} className={segmented(theme === 'dark')}>
                <span className="inline-flex items-center gap-1.5">
                  <Moon size={14} />
                  {t('set.dark')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* notifications */}
      <Card title={t('set.notifications')}>
        <ul className="divide-y divide-border dark:divide-gray-700">
          {notificationRows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-main">{row.label}</p>
                <p className="mt-0.5 text-xs text-muted">{row.desc}</p>
              </div>
              <Switch
                checked={notif[row.id]}
                onChange={(value) => setNotif((prev) => ({ ...prev, [row.id]: value }))}
                label={row.label}
              />
            </li>
          ))}
        </ul>
      </Card>

      {/* app info */}
      <Card title={t('set.appInfo')}>
        <ul className="divide-y divide-border dark:divide-gray-700">
          <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <span className="text-sm text-muted">{t('set.appRowName')}</span>
            <span className="min-w-0 text-sm font-semibold text-main">{t('appName')}</span>
          </li>
          <li className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted">{t('set.appRowVersion')}</span>
            <span className="font-english text-sm font-semibold text-main" dir="ltr">
              1.0.0
            </span>
          </li>
          <li className="py-3 last:pb-0">
            <Link
              to="/about"
              className="flex items-center justify-between gap-3 rounded-lg py-1 transition-colors hover:text-primary dark:hover:text-primary-light"
            >
              <span className="text-sm text-muted">{t('nav.about')}</span>
              <Chevron size={18} className="text-text-light" aria-hidden="true" />
            </Link>
          </li>
        </ul>

        <Button variant="danger" className="mt-4 w-full">
          <LogOut size={18} />
          {t('set.logout')}
        </Button>
      </Card>

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">{t('demoNote')}</p>
    </div>
  )
}

const segmented = (active) =>
  `rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
    active
      ? 'bg-white text-primary shadow-sm dark:bg-gray-800 dark:text-white'
      : 'text-text-light hover:text-text-dark dark:text-gray-400 dark:hover:text-gray-200'
  }`
