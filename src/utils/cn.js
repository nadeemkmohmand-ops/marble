/** Tiny classname joiner (no external dependency). */
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ')
}

export default cn
