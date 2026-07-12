const base = 'text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5'

const variants = {
  primary: `${base} bg-accent text-white px-4 py-2 hover:bg-accent/90`,
  secondary: `${base} border border-line text-ink px-4 py-2 hover:border-accent hover:text-accent`,
  link: `${base} text-accent px-0 py-0 hover:underline`,
}

export default function Button({ variant = 'primary', children, ...props }) {
  return (
    <button className={variants[variant]} {...props}>
      {children}
    </button>
  )
}
