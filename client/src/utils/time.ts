const relativeTimeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'always' })

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)

  for (const [unit, secondsInUnit] of TIME_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return relativeTimeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }

  return relativeTimeFormatter.format(0, 'second')
}
