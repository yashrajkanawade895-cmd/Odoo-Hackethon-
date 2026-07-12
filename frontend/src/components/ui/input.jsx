import { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

// forwardRef is required here: react-hook-form's register() attaches a ref to
// read/track the field. Without forwarding it, RHF silently sees every field
// as unmounted and submits `undefined`, which is why Zod showed "Required"
// under fields that visibly had text in them.
export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
