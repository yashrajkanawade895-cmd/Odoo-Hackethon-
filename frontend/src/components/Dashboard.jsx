import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import KpiCard from './KpiCard.jsx'
import PageHeader from './PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/index.js'
import { overdueItems, upcomingItems, quickActions, shortcuts } from '../data/mockData.js'

const quickActionIcon = {
  register: 'Package',
  book: 'Calendar',
  maintenance: 'Wrench',
}

// Where each quick action takes you.
const quickActionRoute = {
  register: '/assets',
  book: '/bookings',
  maintenance: '/maintenance',
}

// GET /dashboard/kpis returns one flat object; map it to per-role card sets so
// an employee doesn't see org-wide admin numbers.
function cardsForRole(role, kpis) {
  if (!kpis) return []
  const all = [
    { key: 'available', label: 'Assets available', value: kpis.available, stripe: 'available', icon: 'Package' },
    { key: 'allocated', label: 'Assets allocated', value: kpis.allocated, stripe: 'allocated', icon: 'ArrowLeftRight' },
    { key: 'maintenanceToday', label: 'Maintenance today', value: kpis.maintenanceToday, stripe: 'maintenance', icon: 'Wrench' },
    { key: 'activeBookings', label: 'Active bookings', value: kpis.activeBookings, stripe: 'allocated', icon: 'Calendar' },
    { key: 'pendingTransfers', label: 'Pending transfers', value: kpis.pendingTransfers, stripe: 'reserved', icon: 'RefreshCw' },
    { key: 'upcomingReturns', label: 'Upcoming returns', value: kpis.upcomingReturns, stripe: 'available', icon: 'Clock' },
    { key: 'overdueReturns', label: 'Overdue returns', value: kpis.overdueReturns, stripe: 'lost', icon: 'AlertTriangle' },
  ]
  if (role === 'dept_head') return all.filter((c) => ['available', 'allocated', 'maintenanceToday', 'activeBookings', 'overdueReturns'].includes(c.key))
  if (role === 'asset_manager') return all.filter((c) => ['available', 'allocated', 'maintenanceToday', 'pendingTransfers', 'overdueReturns'].includes(c.key))
  if (role === 'employee') return [{ key: 'mine', label: 'My allocated assets', value: 2, stripe: 'allocated', icon: 'Package' }]
  return all
}

function ActivityRow({ item, overdue }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-md transition-colors duration-150 hover:bg-surface ${
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

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'admin'
  const { data: kpisData, isLoading } = useQuery({ queryKey: ['dashboard-kpis'], queryFn: api.dashboard.kpis })
  const kpis = cardsForRole(role, kpisData)
  const overdueCount = role === 'employee' ? 0 : overdueItems.length

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your asset operations" />

      <div className="flex flex-wrap gap-3 mb-6">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[150px] h-[92px] bg-panel border border-line rounded-lg animate-pulse" />
          ))}
        {!isLoading && kpis.map(({ key, ...card }) => <KpiCard key={key} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-panel border border-line rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ink">
              Activity feed
              {overdueCount > 0 && (
                <span className="ml-2 text-xs bg-status-lost/10 text-status-lost px-2 py-0.5 rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/notifications')} className="text-xs text-accent hover:underline">View all</button>
          </div>
          {overdueCount > 0 && (
            <div className="space-y-2 mb-4">
              {overdueItems.map((item) => (
                <ActivityRow key={item.id} item={item} overdue />
              ))}
            </div>
          )}
          <div className="space-y-2">
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
                  onClick={() => navigate(quickActionRoute[action.key] || '/dashboard')}
                  className="lift-on-hover flex items-center gap-3 text-left px-3 py-2.5 rounded-md border border-line hover:border-accent group"
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
              <button key={s.key} onClick={() => navigate(`/${s.key}`)} className="flex flex-col items-center gap-1.5 text-ink/70 hover:text-accent group">
                <span className="w-9 h-9 rounded-md border border-line flex items-center justify-center transition-all duration-150 group-hover:border-accent group-hover:-translate-y-0.5 group-hover:shadow-md">
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
