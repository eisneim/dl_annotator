export function dotPrecision(num, factor) {
  let base = Math.pow(10, factor)
  return Math.round(num * base) / base
}