import { appConfig } from '../config/app.config.js'

/**
 * App-level identity constants (labels for the UI live in src/i18n/locales/).
 */
export const APP_INFO = {
  name: appConfig.name,
  version: appConfig.version,
  factory: 'Mohmand Marble Factory',
  location: 'Mohmand, KPK, Pakistan',
}

export default APP_INFO
