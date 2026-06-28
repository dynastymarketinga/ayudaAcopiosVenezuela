import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../utils/time'

interface RelativeCreatedAtProps {
  date: string
  className?: string
}

export function RelativeCreatedAt({ date, className = 'centro-created-at' }: RelativeCreatedAtProps) {
  const [, tick] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tick((value) => value + 1)
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <span className={className} title={new Date(date).toLocaleString('es-VE')}>
      Creado {formatRelativeTime(date)}
    </span>
  )
}
