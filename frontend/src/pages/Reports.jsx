import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { api } from '../api/index.js'

function ChartCard({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <p className="text-sm font-medium text-ink mb-3">{title}</p>
      <div style={{ width: '100%', height: 220 }}>{children}</div>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="w-full h-full bg-surface border border-line rounded-md animate-pulse" />
}

function EmptyState({ message = 'No data yet' }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-sm text-ink/40">
      {message}
    </div>
  )
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HEATMAP_HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20 keeps the grid compact

export default function Reports() {
  // Each report is backend-computed; wire each to its own query so an empty
  // aggregate (several currently return []) degrades to a "No data yet" state
  // instead of a blank chart.
  const utilization = useQuery({
    queryKey: ['report-utilization'],
    queryFn: () => api.reports.getUtilization(),
  })
  const maintenanceFrequency = useQuery({
    queryKey: ['report-maintenance-frequency'],
    queryFn: () => api.reports.getMaintenanceFrequency(),
  })
  const departmentAllocation = useQuery({
    queryKey: ['report-department-allocation'],
    queryFn: () => api.reports.getDepartmentAllocation(),
  })
  const bookingHeatmap = useQuery({
    queryKey: ['report-booking-heatmap'],
    queryFn: () => api.reports.getBookingHeatmap(),
  })
  const maintenanceDue = useQuery({
    queryKey: ['report-maintenance-due'],
    queryFn: () => api.reports.getMaintenanceDue(),
  })

  // Defensive: every aggregate may be empty. Code against the exact backend shapes.
  const utilizationData = utilization.data ?? [] // [{ category, total, allocated, utilizationPercentage }]
  const maintenanceData = maintenanceFrequency.data ?? [] // [{ category, count }]
  const departmentData = departmentAllocation.data ?? [] // [{ department, count }]
  const heatmapData = bookingHeatmap.data ?? [] // [{ day, hour, count }]
  const maintenanceDueData = maintenanceDue.data ?? [] // [{ id, tag, name, status, reason }]

  // Build a { "day-hour": count } lookup so each grid cell is an O(1) read.
  const heatmapLookup = {}
  let heatmapMax = 0
  for (const cell of heatmapData) {
    heatmapLookup[`${cell.day}-${cell.hour}`] = cell.count
    if (cell.count > heatmapMax) heatmapMax = cell.count
  }

  async function handleExport() {
    try {
      const res = await api.reports.exportReport('utilization', 'csv')
      if (res?.url && res.url !== '#') window.open(res.url, '_blank')
    } catch {
      // Export endpoint may not be wired yet; fail quietly rather than crash the page.
    }
  }

  return (
    <>
      <PageHeader
        title="Reports and analytics"
        subtitle="Actionable operational insight across assets, bookings, and maintenance."
        action={<Button variant="secondary" onClick={handleExport}>Export CSV</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Asset utilization by category">
          {utilization.isLoading ? (
            <ChartSkeleton />
          ) : utilizationData.length ? (
            <ResponsiveContainer>
              <BarChart data={utilizationData}>
                <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Utilization']} />
                <Bar dataKey="utilizationPercentage" fill="#2B6E5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Maintenance frequency by category">
          {maintenanceFrequency.isLoading ? (
            <ChartSkeleton />
          ) : maintenanceData.length ? (
            <ResponsiveContainer>
              <BarChart data={maintenanceData}>
                <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#B8863B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Department-wise allocation">
          {departmentAllocation.isLoading ? (
            <ChartSkeleton />
          ) : departmentData.length ? (
            <ResponsiveContainer>
              <BarChart data={departmentData}>
                <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3D5A8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Booking activity heatmap">
          {bookingHeatmap.isLoading ? (
            <ChartSkeleton />
          ) : heatmapData.length ? (
            <div className="w-full h-full overflow-auto">
              <div className="inline-flex flex-col gap-1 text-[10px] text-ink/50">
                {/* Hour axis */}
                <div className="flex gap-1 pl-8">
                  {HEATMAP_HOURS.map((h) => (
                    <div key={h} className="w-4 text-center tabular-nums">
                      {h % 3 === 0 ? h : ''}
                    </div>
                  ))}
                </div>
                {DAY_LABELS.map((label, day) => (
                  <div key={day} className="flex items-center gap-1">
                    <div className="w-7 pr-1 text-right">{label}</div>
                    {HEATMAP_HOURS.map((hour) => {
                      const count = heatmapLookup[`${day}-${hour}`] ?? 0
                      const opacity = heatmapMax > 0 && count > 0 ? 0.15 + 0.85 * (count / heatmapMax) : 0
                      return (
                        <div
                          key={hour}
                          className="w-4 h-4 rounded-sm border border-line/40"
                          style={{ backgroundColor: count > 0 ? `rgba(43, 110, 94, ${opacity})` : '#F4F2ED' }}
                          title={`${label} ${hour}:00 — ${count} booking${count === 1 ? '' : 's'}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No booking data yet" />
          )}
        </ChartCard>

        <div className="bg-panel border border-line rounded-lg p-4 lg:col-span-2">
          <p className="text-sm font-medium text-ink mb-3">Assets due for maintenance</p>
          {maintenanceDue.isLoading ? (
            <div className="h-40 bg-surface border border-line rounded-md animate-pulse" />
          ) : maintenanceDueData.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink/50 border-b border-line">
                    <th className="py-2 pr-4 font-medium">Tag</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceDueData.map((row) => (
                    <tr key={row.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-4 font-mono-tag text-xs text-ink/80">{row.tag}</td>
                      <td className="py-2 pr-4 text-ink">{row.name}</td>
                      <td className="py-2 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-status-maintenance/10 text-status-maintenance">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 text-ink/70">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-ink/40">No data yet</div>
          )}
        </div>
      </div>
    </>
  )
}
