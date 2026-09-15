/**
 * Layout breakpoints — mirror the Tailwind theme screens (tailwind.config.js).
 * MEDIA_QUERIES are ready-made strings for the useMediaQuery hook.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export const MEDIA_QUERIES = {
  smUp: '(min-width: 640px)',
  mdUp: '(min-width: 768px)',
  lgUp: '(min-width: 1024px)',
  xlUp: '(min-width: 1280px)',
  mdDown: '(max-width: 767px)',
  lgDown: '(max-width: 1023px)',
  dark: '(prefers-color-scheme: dark)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
}
