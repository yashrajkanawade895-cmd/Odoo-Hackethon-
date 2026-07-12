import { cn } from '../../lib/utils.js'

export function Card({ className, ...props }) {
  return <div className={cn('bg-panel border border-line rounded-lg', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('px-5 pt-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-base font-semibold text-ink', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-xs text-ink/50 mt-1', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}
