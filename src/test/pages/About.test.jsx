import { CheckCircle2, Code2, Factory, Mail, MapPin, Phone, UserCog, Users } from 'lucide-react'
import Card from '../components/UI/Card.jsx'
import PageHeader from '../components/UI/PageHeader.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import {
  appFeatures,
  factoryDesignations,
  factoryInfo,
  managementTeam,
} from '../data/placeholderData.js'

/**
 * About (تعارف) — app description, features, factory info and
 * developer contact placeholders.
 */
export default function About() {
  const { t, pick } = useAppUI()

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={t('nav.about')} en="About" subtitle={t('about.subtitle')} />

      {/* app identity */}
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <img src="/icons/icon-192x192.png" alt={t('appName')} className="h-20 w-20 rounded-2xl shadow-md" />
          <div>
            <h2 className="text-lg font-bold text-main">{t('appName')}</h2>
            <p className="mt-0.5 text-xs text-muted">{t('tagline')}</p>
          </div>
          <span
            className="rounded-full bg-primary-50 px-3 py-1 font-english text-xs font-bold text-primary dark:bg-primary/25 dark:text-primary-light"
            dir="ltr"
          >
            v1.0.0
          </span>
        </div>
      </Card>

      {/* description */}
      <Card title={t('about.appTitle')}>
        <p className="text-sm leading-loose text-main">{t('about.description1')}</p>
        <p className="mt-3 text-sm leading-loose text-main">{t('about.description2')}</p>
      </Card>

      {/* features */}
      <Card title={t('about.features')}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {appFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              <span className="text-sm font-medium leading-relaxed text-main">{pick(feature)}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* factory + management team */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card title={t('about.factoryInfo')}>
          <ul className="divide-y divide-border dark:divide-gray-700">
            <InfoRow icon={Factory} label={t('about.factory')} value={pick(factoryInfo.name)} />
            <InfoRow icon={MapPin} label={t('about.address')} value={pick(factoryInfo.address)} />
            <InfoRow icon={Phone} label={t('about.phone')} value={factoryInfo.phone} ltr />
            <InfoRow icon={Mail} label={t('about.email')} value={factoryInfo.email} ltr />
          </ul>
        </Card>

        {/* co-founders + designations */}
        <Card title={t('about.managementTitle')}>
          <ul className="divide-y divide-border dark:divide-gray-700">
            {managementTeam.map((person) => (
              <li key={person.name.en} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary dark:bg-primary/25 dark:text-primary-light">
                  <Users size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="urdu-text text-sm font-bold text-main">{pick(person.name)}</p>
                  <p className="urdu-text text-xs text-muted">{pick(person.designation)}</p>
                </div>
                {person.founder && (
                  <span className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-[11px] font-bold text-accent-dark dark:bg-accent/25 dark:text-accent-light">
                    {t('about.founder')}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-border pt-4 dark:border-gray-700">
            <p className="flex items-center gap-2 text-xs font-bold text-muted">
              <UserCog size={14} aria-hidden="true" />
              {t('about.otherDesignations')}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {factoryDesignations.map((d) => (
                <span
                  key={d.en}
                  className="urdu-text rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-main dark:bg-gray-700 dark:text-gray-100"
                >
                  {pick(d)}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* developer */}
      <Card title={t('about.developerInfo')}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-dark dark:text-accent-light">
            <Code2 size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-main">{t('about.developerName')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{t('about.developerNote')}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, ltr = false }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Icon size={18} className="shrink-0 text-primary dark:text-primary-light" aria-hidden="true" />
      <span className="w-16 shrink-0 text-xs font-semibold text-muted sm:w-20">{label}</span>
      <span
        className={`min-w-0 flex-1 text-sm font-medium text-main ${ltr ? 'font-english' : ''}`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </span>
    </li>
  )
}
