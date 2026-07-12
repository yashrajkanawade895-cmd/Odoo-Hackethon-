import * as Icons from 'lucide-react'

const stripeColor = {
  available: 'border-status-available',
  allocated: 'border-status-allocated',
  reserved: 'border-status-reserved',
  maintenance: 'border-status-maintenance',
  lost: 'border-status-lost',
  retired: 'border-status-retired',
}

const iconColor = {
  available: 'text-status-available',
  allocated: 'text-status-allocated',
  reserved: 'text-status-reserved',
  maintenance: 'text-status-maintenance',
  lost: 'text-status-lost',
  retired: 'text-status-retired',
}

export default function KpiCard({ label, value, stripe = 'available', icon }) {
  const Icon = Icons[icon] || Icons.Package

  return (
    <div
      className={`flex-1 min-w-[150px] bg-panel border border-line border-l-4 ${stripeColor[stripe]} rounded-lg px-4 py-3`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-ink/60">{label}</p>
        <Icon size={16} className={iconColor[stripe]} />
      </div>
      <p className="font-mono-tag text-2xl font-semibold text-ink mb-1">{value}</p>
      <button className="text-xs text-accent hover:underline">View all</button>
    </div>
  )
}
