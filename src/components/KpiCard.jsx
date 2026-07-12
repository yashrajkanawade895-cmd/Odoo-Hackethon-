const stripeColor = {
  available: 'border-status-available',
  allocated: 'border-status-allocated',
  reserved: 'border-status-reserved',
  maintenance: 'border-status-maintenance',
  lost: 'border-status-lost',
  retired: 'border-status-retired',
}

export default function KpiCard({ label, value, stripe = 'available' }) {
  return (
    <div
      className={`flex-1 min-w-[140px] bg-panel border border-line border-l-4 ${stripeColor[stripe]} rounded-lg px-4 py-3`}
    >
      <p className="text-xs text-ink/60 mb-1">{label}</p>
      <p className="font-mono-tag text-2xl font-semibold text-ink">{value}</p>
    </div>
  )
}
