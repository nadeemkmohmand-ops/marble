/**
 * cn — joins conditional class names (Tailwind-friendly, dependency-free).
 *   cn('a', false && 'b', ['c', undefined]) → 'a c'
 */
export function cn(...args) {
  return args.flat(Infinity).filter(Boolean).join(' ')
}

export default cn
