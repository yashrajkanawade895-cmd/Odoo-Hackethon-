import { useState } from 'react'
import KpiCard from './KpiCard.jsx'
import { kpisByRole, overdueItems, upcomingItems, quickActions } from '../data/mockData.js'

const roleLabels = {
  admin: 'Admin',
  departmentHead: 'Department head',
  employee: 'Employee',
}

function ActivityRow({ item, overdue }) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-md ${
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
  const [role, setRole] = useState('admin')
  const kpis = kpisByRole[role]
  const isEmployee = role === 'employee'

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-panel border-b border-line">
        <div className="flex items-center gap-2">
          <span className="font-mono-tag text-accent font-semibold text-lg">AssetFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search asset tag, serial, or QR code"
            className="text-sm border border-line rounded-md px-3 py-1.5 w-72 bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-sm border border-line rounded-md px-2 py-1.5 bg-surface"
          >
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label} view
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="px-6 py-6 max-w-6xl mx-auto">
        {/* KPI row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="lg:col-span-2 bg-panel border border-line rounded-lg p-4">
            <h2 className="text-sm font-medium text-ink mb-3">Overdue</h2>
            <div className="space-y-2 mb-5">
              {overdueItems.map((item) => (
                <ActivityRow key={item.id} item={item} overdue />
              ))}
            </div>
            <h2 className="text-sm font-medium text-ink mb-3">Upcoming</h2>
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-panel border border-line rounded-lg p-4 h-fit">
            <h2 className="text-sm font-medium text-ink mb-3">Quick actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  className="text-sm text-left px-3 py-2 rounded-md border border-line hover:border-accent hover:text-accent transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isEmployee && (
          <p className="text-xs text-ink/50 mt-4">
            Employee view shows only assets and bookings tied to this account — no org-wide KPIs.
          </p>
        )}
      </main>
    </div>
  )
}
