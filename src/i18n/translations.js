/**
 * @deprecated Kept only for backward compatibility.
 *
 * The i18n dictionary now lives in `src/i18n/locales/{ur,en}.js`, merged and
 * resolved by `src/i18n/index.js` (nested namespaces + {{param}} interpolation
 * + plurals). New code should import `translate` from '../i18n/index.js' or
 * use the `t()` helper from the language context.
 */
import { toLegacyTranslations } from './index.js'

export const translations = toLegacyTranslations()
