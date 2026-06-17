/**
 * Number formatting utilities — ported from main.js
 */
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

export function formatNumberFull(num) {
  return Number(num).toLocaleString()
}
