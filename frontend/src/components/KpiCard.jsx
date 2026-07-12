import * as Icons from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

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

const lineColor = {
  available: '#2B6E5E',
  allocated: '#3D5A8A',
  reserved: '#8A6D3D',
  maintenance: '#B8863B',
  lost: '#A13D3D',
  retired: '#8B8680',
}

// Deterministic pseudo-trend derived from the value itself, so it stays stable across renders
// without needing real historical data yet.
function seedTrend(value) {
  const base = typeof value === 'number' ? value : 10
  let seed = base
  const points = []
  for (let i = 0; i < 8; i++) {
    seed = (seed * 9301 + 49297) % 233280
    const noise = (seed / 233280 - 0.5) * base * 0.18
    points.push({ v: Math.max(base * 0.6 + noise + (i / 8) * base * 0.15, 0) })
  }
  points.push({ v: base })
  return points
}

export default function KpiCard({ label, value, stripe = 'available', icon }) {
  const Icon = Icons[icon] || Icons.Package
  const trend = seedTrend(value)

  return (
    <div
      className={`lift-on-hover flex-1 min-w-[150px] bg-panel border border-line border-l-4 ${stripeColor[stripe]} rounded-lg px-4 py-3`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-ink/60">{label}</p>
        <Icon size={16} className={iconColor[stripe]} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="font-mono-tag text-2xl font-semibold text-ink mb-1">{value}</p>
        <div className="w-16 h-7 mb-1 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={lineColor[stripe]}
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <button className="text-xs text-accent hover:underline">View all</button>
    </div>
  )
}
