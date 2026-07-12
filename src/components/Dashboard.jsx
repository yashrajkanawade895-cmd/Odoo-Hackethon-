import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import KpiCard from './KpiCard.jsx'
import PageHeader from './PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { overdueItems, upcomingItems, quickActions, shortcuts } from '../data/mockData.js'

const quickActionIcon = {
  register: 'Package',
  book: 'Calendar',
  maintenance: 'Wrench',
}

function ActivityRow({ item, overdue }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-md ${
        overdue ? 'border-l-4 border-status-lost bg-status-lost/5' : 'border-l-4 border-line'
      }`}
    >
      <div>
        <p className="text-sm text-ink">{item.detail}</p>
        <p className="text-xs text-ink/50 mt-0.5">
          {item.type} · <span className="font-mono-tag">{item.id}</span>
        </p>
      </div>
      <p className={`text-xs font-mono-tag ${overdue ? 'text-status-lost' : 'text-ink/60'}`}>{item.dueDate}</p>
    </div>
  )
}

function buildKpis(role, data) {
  if (!data) return []
  
  const allKpis = [
    { key: 'available', label: 'Assets available', value: data.available || 0, stripe: 'available', icon: 'Package' },
    { key: 'allocated', label: 'Assets allocated', value: data.allocated || 0, stripe: 'allocated', icon: 'ArrowLeftRight' },
    { key: 'maintenanceToday', label: 'Maintenance today', value: data.maintenanceToday || 0, stripe: 'maintenance', icon: 'Wrench' },
    { key: 'activeBookings', label: 'Active bookings', value: data.activeBookings || 0, stripe: 'allocated', icon: 'Calendar' },
    { key: 'pendingTransfers', label: 'Pending transfers', value: data.pendingTransfers || 0, stripe: 'reserved', icon: 'RefreshCw' },
    { key: 'upcomingReturns', label: 'Upcoming returns', value: data.upcomingReturns || 0, stripe: 'available', icon: 'Clock' },
    { key: 'overdueReturns', label: 'Overdue returns', value: data.overdueReturns || 0, stripe: 'lost', icon: 'AlertTriangle' },
  ]

  if (role === 'employee') {
    return [{ label: 'My allocated assets', value: data.allocated || 0, stripe: 'allocated', icon: 'Package' }]
  }

  if (role === 'dept_head') {
    return allKpis.filter(k => ['available', 'allocated', 'maintenanceToday', 'activeBookings', 'overdueReturns'].includes(k.key))
  }

  if (role === 'asset_manager') {
    return allKpis.filter(k => ['available', 'allocated', 'maintenanceToday', 'pendingTransfers', 'overdueReturns'].includes(k.key))
  }

  return allKpis
}

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'employee'
  
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: api.dashboard.kpis
  })

  const kpis = buildKpis(role, kpiData)
  const overdueCount = kpiData?.overdueReturns || 0

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your asset operations" />

      {isLoading ? (
        <div className="p-4 text-sm text-ink/60">Loading metrics...</div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-panel border border-line rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ink">
              Activity feed
              {overdueCount > 0 && role !== 'employee' && (
                <span className="ml-2 text-xs bg-status-lost/10 text-status-lost px-2 py-0.5 rounded-full">
                  {overdueCount} overdue overall
                </span>
              )}
            </h2>
            <button className="text-xs text-accent hover:underline">View all</button>
          </div>
          <div className="space-y-2 mb-4">
            {/* TODO: Replace with live overdue activity/notifications API */}
            {overdueItems.map((item) => (
              <ActivityRow key={item.id} item={item} overdue />
            ))}
          </div>
          <div className="space-y-2">
            {/* TODO: Replace with live upcoming activity API */}
            {upcomingItems.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-lg p-4 h-fit">
          <h2 className="text-sm font-medium text-ink mb-3">Quick actions</h2>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => {
              const Icon = Icons[quickActionIcon[action.key]]
              return (
                <button
                  key={action.key}
                  className="flex items-center gap-3 text-left px-3 py-2.5 rounded-md border border-line hover:border-accent group"
                >
                  <span className="w-8 h-8 rounded-md bg-status-available/10 flex items-center justify-center text-status-available shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm text-ink group-hover:text-accent">{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg p-4">
        <h2 className="text-sm font-medium text-ink mb-3">Shortcuts</h2>
        <div className="flex gap-4">
          {shortcuts.map((s) => {
            const Icon = Icons[s.icon]
            return (
              <button key={s.key} className="flex flex-col items-center gap-1.5 text-ink/70 hover:text-accent">
                <span className="w-9 h-9 rounded-md border border-line flex items-center justify-center">
                  <Icon size={16} />
                </span>
                <span className="text-xs">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
