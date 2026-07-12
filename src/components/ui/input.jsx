import { cn } from '../../lib/utils.js'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
