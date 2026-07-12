import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

export default function Reports() {
  // Each report is backend-computed; wire each to its own query so an empty
  // aggregate (several currently return []) degrades to a "No data yet" state
  // instead of a blank chart.
  const utilization = useQuery({
    queryKey: ['report-utilization'],
    queryFn: () => api.reports.getUtilization(),
  })
  const departmentAllocation = useQuery({
    queryKey: ['report-department-allocation'],
    queryFn: () => api.reports.getDepartmentAllocation(),
  })
  const maintenanceFrequency = useQuery({
    queryKey: ['report-maintenance-frequency'],
    queryFn: () => api.reports.getMaintenanceFrequency(),
  })
  const bookingHeatmap = useQuery({
    queryKey: ['report-booking-heatmap'],
    queryFn: () => api.reports.getBookingHeatmap(),
  })

  // Backend shapes vary per report; normalize to { label, value } defensively so
  // both current keys and any future rename keep rendering.
  const utilizationData = utilization.data ?? []
  const departmentData = (departmentAllocation.data ?? []).map((r) => ({
    label: r.department ?? r.label,
    value: r.value ?? r.count,
  }))
  const maintenanceData = (maintenanceFrequency.data ?? []).map((r) => ({
    label: r.category ?? r.label,
    value: r.value ?? r.count,
  }))
  const heatmapData = bookingHeatmap.data ?? []

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
        <ChartCard title="Asset utilization trend">
          {utilization.isLoading ? (
            <ChartSkeleton />
          ) : utilizationData.length ? (
            <ResponsiveContainer>
              <LineChart data={utilizationData}>
                <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="utilizationPercentage" stroke="#2B6E5E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
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
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
                <Tooltip />
                <Bar dataKey="value" fill="#3D5A8A" radius={[4, 4, 0, 0]} />
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
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#8B8680" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
                <Tooltip />
                <Bar dataKey="value" fill="#B8863B" radius={[4, 4, 0, 0]} />
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
            <div className="grid grid-cols-7 gap-1 w-full h-full content-start">
              {heatmapData.map((cell, i) => (
                <div
                  key={cell.id ?? i}
                  className="aspect-square rounded-sm bg-status-available/20"
                  title={`${cell.label ?? cell.day ?? ''}: ${cell.value ?? cell.count ?? 0}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No booking data yet" />
          )}
        </ChartCard>
      </div>
    </>
  )
}
