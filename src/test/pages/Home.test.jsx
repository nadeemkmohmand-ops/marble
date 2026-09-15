import { Link } from 'react-router-dom'
import { Gem } from 'lucide-react'
import Card from '../components/UI/Card.jsx'
import ChartPlaceholder from '../components/UI/ChartPlaceholder.jsx'
import { useAppUI } from '../context/AppUIContext.jsx'
import { homeStats, quickActions, recentActivities, weeklyProduction } from '../data/placeholderData.js'

/**
 * Home (ہوم) — Dashboard with static summary cards, quick actions,
 * recent activity list and a weekly production chart. All numbers are placeholders.
 */
export default function Home() {
  const { t, pick } = useAppUI()

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-primary-light to-primary-dark p-5 text-white shadow-md sm:p-6">
        <Gem size={150} strokeWidth={1} className="pointer-events-none absolute -bottom-8 -start-8 text-white/10" aria-hidden="true" />
        <p className="text-sm text-white/70">{t('home.welcome')}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t('factoryName')}</h1>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {t('home.todayDate')}
        </p>
      </section>

      {/* summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {homeStats.map((stat) => (
          <StatCard key={stat.labelKey} stat={stat} label={t(stat.labelKey)} />
        ))}
      </section>

      {/* quick actions */}
      <section aria-label={t('home.quickActions')}>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center shadow-sm transition-colors ${action.cls}`}
            >
              <action.icon size={24} />
              <span className="text-[11px] font-bold sm:text-sm">{t(action.labelKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* activity + chart */}
      <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card title={t('home.recentActivity')}>
          <ul className="divide-y divide-border dark:divide-gray-700">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${activity.iconClass}`}
                >
                  <activity.icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-main">{pick(activity.title)}</p>
                  <p className="mt-0.5 text-xs text-muted">{pick(activity.detail)}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-muted">
                  {pick(activity.time)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={t('home.weeklyOverview')}
          action={
            <Link
              to="/reports"
              className="text-xs font-bold text-primary transition-colors hover:text-primary-light dark:text-primary-light"
            >
              {t('home.viewReports')}
            </Link>
          }
        >
          <ChartPlaceholder
            data={weeklyProduction.map((d) => ({ label: pick(d.label), value: d.value }))}
            height="h-48"
          />
        </Card>
      </section>
    </div>
  )
}

function StatCard({ stat, label }) {
  const Icon = stat.icon
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${stat.iconClass}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 font-english text-2xl font-bold text-main sm:text-3xl">{stat.value}</p>
    </div>
  )
}
