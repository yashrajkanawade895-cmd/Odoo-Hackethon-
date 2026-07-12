import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { api } from '../api/client.js'

function ChartCard({ title, children, isLoading }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <p className="text-sm font-medium text-ink mb-3">{title}</p>
      {isLoading
        ? <div className="flex items-center justify-center h-[220px] text-sm text-ink/40">Loading...</div>
        : <div style={{ width: '100%', height: 220 }}>{children}</div>
      }
    </div>
  )
}

export default function Reports() {
  const { data: utilizationData = [], isLoading: utilLoading } = useQuery({
    queryKey: ['reports', 'utilization'],
    queryFn: api.reports.utilization
  })

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('bento_token')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/reports/export?type=csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'assets-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
  }

  // Derive dept-allocation from utilization data for chart
  const deptAllocation = utilizationData.map(d => ({
    department: d.category,
    allocated: d.allocated,
  }))

  const maintenanceFreq = utilizationData.map(d => ({
    category: d.category,
    count: d.total - d.allocated,
  }))

  return (
    <>
      <PageHeader
        title="Reports and analytics"
        subtitle="Actionable operational insight across assets, bookings, and maintenance."
        action={<Button variant="secondary" onClick={handleExport}>Export CSV</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Asset utilization by category" isLoading={utilLoading}>
          <ResponsiveContainer>
            <BarChart data={utilizationData}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip formatter={(v, name) => [v, name === 'utilizationPercentage' ? 'Utilization %' : name]} />
              <Bar dataKey="utilizationPercentage" name="Utilization %" fill="#2B6E5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Allocated vs total by category" isLoading={utilLoading}>
          <ResponsiveContainer>
            <BarChart data={utilizationData}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#3D5A8A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="allocated" name="Allocated" fill="#2B6E5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Available assets by category" isLoading={utilLoading}>
          <ResponsiveContainer>
            <BarChart data={maintenanceFreq}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip />
              <Bar dataKey="count" name="Available" fill="#B8863B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-panel border border-line rounded-lg p-4">
          <p className="text-sm font-medium text-ink mb-3">Utilization summary</p>
          {utilLoading ? (
            <p className="text-sm text-ink/40">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-ink/60">
                <tr>
                  <th className="text-left pb-2">Category</th>
                  <th className="text-right pb-2">Total</th>
                  <th className="text-right pb-2">Allocated</th>
                  <th className="text-right pb-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {utilizationData.map((d) => (
                  <tr key={d.category} className="border-t border-line">
                    <td className="py-2 text-ink">{d.category}</td>
                    <td className="py-2 text-right text-ink/70">{d.total}</td>
                    <td className="py-2 text-right text-ink/70">{d.allocated}</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs font-medium ${d.utilizationPercentage > 80 ? 'text-status-lost' : d.utilizationPercentage > 50 ? 'text-status-maintenance' : 'text-status-available'}`}>
                        {d.utilizationPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
