import React from 'react'
import Toolbar from '../components/UI/Toolbar'
import Card, { CardHeader } from '../components/UI/Card'
import { useLang } from '../context/LanguageContext'
import APP_INFO from '../constants/appInfo'
import { CheckCircle2 } from 'lucide-react'

export default function About() {
  const { t, lang } = useLang()
  const features = (t('about.featureList') || '').split(' · ')
  return (
    <div className="fade-in max-w-2xl">
      <Toolbar title={t('about.title')} description={t('about.subtitle')} />
      <Card className="text-center mb-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--accent)] grid place-items-center text-white text-3xl font-bold">M</div>
        <h2 className="mt-3 font-bold text-lg leading-urdu no-clip">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</h2>
        <p className="text-xs text-[var(--muted)] num mt-1">{t('about.version')} {APP_INFO.version}</p>
      </Card>
      <Card>
        <CardHeader title={t('about.features')} />
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-urdu no-clip">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-[11px] text-[var(--muted)] mt-4 text-center leading-urdu no-clip">{t('about.tech')}</p>
    </div>
  )
}
