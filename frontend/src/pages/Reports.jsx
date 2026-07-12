import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'

// Placeholder aggregates — swap for GET /reports/* once Yashraj's SQL aggregates land.
const utilizationTrend = [
  { month: 'Feb', utilization: 62 },
  { month: 'Mar', utilization: 68 },
  { month: 'Apr', utilization: 71 },
  { month: 'May', utilization: 75 },
  { month: 'Jun', utilization: 79 },
  { month: 'Jul', utilization: 81 },
]

const departmentAllocation = [
  { department: 'Engineering', allocated: 210 },
  { department: 'Design', allocated: 94 },
  { department: 'Frontend', allocated: 58 },
  { department: 'Facilities', allocated: 132 },
]

const maintenanceFrequency = [
  { category: 'Electronics', count: 34 },
  { category: 'Vehicles', count: 21 },
  { category: 'Furniture', count: 6 },
  { category: 'Rooms', count: 3 },
]

function ChartCard({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <p className="text-sm font-medium text-ink mb-3">{title}</p>
      <div style={{ width: '100%', height: 220 }}>{children}</div>
    </div>
  )
}

function toCsv(rows) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function exportReportCsv() {
  const sections = [
    ['Asset utilization trend'],
    ['Month', 'Utilization %'],
    ...utilizationTrend.map((r) => [r.month, r.utilization]),
    [],
    ['Department-wise allocation'],
    ['Department', 'Assets allocated'],
    ...departmentAllocation.map((r) => [r.department, r.allocated]),
    [],
    ['Maintenance frequency by category'],
    ['Category', 'Requests'],
    ...maintenanceFrequency.map((r) => [r.category, r.count]),
  ]
  const csv = toCsv(sections)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `assetflow-report-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function Reports() {
  return (
    <>
      <PageHeader
        title="Reports and analytics"
        subtitle="Actionable operational insight across assets, bookings, and maintenance."
        action={<Button variant="secondary" onClick={exportReportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Asset utilization trend">
          <ResponsiveContainer>
            <LineChart data={utilizationTrend}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip />
              <Line type="monotone" dataKey="utilization" stroke="#2B6E5E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department-wise allocation">
          <ResponsiveContainer>
            <BarChart data={departmentAllocation}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip />
              <Bar dataKey="allocated" fill="#3D5A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance frequency by category">
          <ResponsiveContainer>
            <BarChart data={maintenanceFrequency}>
              <CartesianGrid stroke="#DCD9D2" strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#8B8680" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8B8680" />
              <Tooltip />
              <Bar dataKey="count" fill="#B8863B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-panel border border-line rounded-lg p-4">
          <p className="text-sm font-medium text-ink mb-3">Nearing retirement / due for maintenance</p>
          <ul className="text-sm text-ink/70 space-y-2">
            <li><span className="font-mono-tag text-accent">AF-0322</span> — Forklift, service due in 4 days</li>
            <li><span className="font-mono-tag text-accent">AF-0114</span> — MacBook Pro, warranty expiring in 12 days</li>
            <li><span className="font-mono-tag text-accent">AF-0450</span> — Projector, nearing end of life (5 years)</li>
          </ul>
        </div>
      </div>
    </>
  )
}
