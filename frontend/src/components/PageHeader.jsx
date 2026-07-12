export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
