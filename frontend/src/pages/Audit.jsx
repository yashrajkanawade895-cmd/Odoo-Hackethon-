import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/index.js'

const resultStyle = {
  pending: 'bg-line text-ink/60',
  verified: 'bg-status-available/10 text-status-available',
  missing: 'bg-status-lost/10 text-status-lost',
  damaged: 'bg-status-maintenance/10 text-status-maintenance',
}

function NewCycleForm({ onCancel, isSubmitting }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [scope, setScope] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [auditors, setAuditors] = useState([])

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.departments.getDepartments() })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => api.employees.getEmployees() })

  const createMutation = useMutation({
    mutationFn: async ({ fields, auditorIds }) => {
      const cycle = await api.audits.createAuditCycle(fields)
      if (auditorIds.length) await api.audits.assignAuditors(cycle.id, auditorIds)
      return cycle
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-cycles'] })
      onCancel()
    },
  })

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const submit = (e) => {
    e.preventDefault()
    if (!name || !scope || !startDate || !endDate) return
    createMutation.mutate({
      fields: { name, scopeDepartmentId: Number(scope), startDate, endDate },
      auditorIds: auditors,
    })
  }

  const pending = isSubmitting || createMutation.isPending

  return (
    <form onSubmit={submit} className="bg-panel border border-line rounded-lg p-4 mb-4">
      <p className="text-sm font-medium text-ink mb-3">New audit cycle</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input placeholder="Cycle name (e.g. Q3 HQ Floor 3 Audit)" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">Scope (department)</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <p className="text-xs font-medium text-ink/60 mb-1.5">Assign auditors</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {employees.map((emp) => (
          <button
            type="button"
            key={emp.id}
            onClick={() => toggle(auditors, setAuditors, emp.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              auditors.includes(emp.id) ? 'bg-status-available/10 border-status-available text-status-available' : 'border-line text-ink/60 hover:border-accent'
            }`}
          >
            {emp.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-ink/40 mb-4">Assets in scope are auto-populated from the selected department when the cycle is created.</p>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Creating…' : 'Create cycle'}</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function CycleCard({ cycle, deptMap }) {
  const qc = useQueryClient()
  const { data: detail, isLoading } = useQuery({
    queryKey: ['audit-cycle', cycle.id],
    queryFn: () => api.audits.getAuditCycle(cycle.id),
    enabled: !!cycle.id,
  })

  const markMutation = useMutation({
    mutationFn: ({ itemId, result }) => api.audits.updateAuditItem(itemId, result),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-cycle', cycle.id] }),
  })

  const closeMutation = useMutation({
    mutationFn: () => api.audits.closeAuditCycle(cycle.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-cycles'] })
      qc.invalidateQueries({ queryKey: ['audit-cycle', cycle.id] })
    },
  })

  const status = detail?.status || cycle.status
  const items = detail?.items || []
  const scopeLabel = cycle.scopeLocation || deptMap[cycle.scopeDepartmentId] || detail?.scopeDepartment?.name || '—'
  const dateRange = `${cycle.startDate || detail?.startDate || ''} to ${cycle.endDate || detail?.endDate || ''}`
  const createdBy = cycle.createdBy?.name || detail?.createdBy?.name || '—'
  const discrepancies = items.filter((i) => i.result === 'missing' || i.result === 'damaged')
  const allMarked = items.length > 0 && items.every((i) => i.result !== 'pending')
  const isOpen = status === 'open'

  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-ink">{cycle.name}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isOpen ? 'bg-status-allocated/10 text-status-allocated' : 'bg-status-retired/10 text-status-retired'}`}>
          {status}
        </span>
      </div>
      <p className="text-xs text-ink/50 mb-3">{scopeLabel} · {dateRange} · Created by: {createdBy}</p>

      {isLoading ? (
        <div className="space-y-2 mb-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 border border-line rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-ink/40 mb-3">No assets in scope for this cycle.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border border-line rounded-md px-3 py-2">
              <span className="text-sm">
                <span className="font-mono-tag text-accent">{item.asset?.tag}</span> <span className="text-ink/70">{item.asset?.name}</span>
                {item.auditor?.name && <span className="text-ink/40 text-xs"> · {item.auditor.name}</span>}
              </span>
              {isOpen ? (
                <div className="flex gap-1">
                  {['verified', 'missing', 'damaged'].map((r) => (
                    <button
                      key={r}
                      disabled={markMutation.isPending}
                      onClick={() => markMutation.mutate({ itemId: item.id, result: r })}
                      className={`text-xs px-2 py-1 rounded-full capitalize ${item.result === r ? resultStyle[r] : 'text-ink/40 hover:bg-surface'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${resultStyle[item.result]}`}>{item.result}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {discrepancies.length > 0 && (
        <div className="bg-status-lost/5 border border-status-lost/30 rounded-md px-3 py-2 mb-3">
          <p className="text-xs font-medium text-status-lost mb-1">Discrepancy report ({discrepancies.length})</p>
          {discrepancies.map((d) => (
            <p key={d.id} className="text-xs text-ink/70">
              <span className="font-mono-tag">{d.asset?.tag}</span> — flagged {d.result}
              {d.result === 'missing' && <span className="text-ink/40"> · status will move to Lost on close</span>}
            </p>
          ))}
        </div>
      )}

      {isOpen && (
        <Button size="sm" disabled={!allMarked || closeMutation.isPending} onClick={() => closeMutation.mutate()}>
          {closeMutation.isPending ? 'Closing…' : 'Close audit cycle'}
        </Button>
      )}
    </div>
  )
}

export default function Audit() {
  const [showForm, setShowForm] = useState(false)

  const { data: cycles = [], isLoading } = useQuery({ queryKey: ['audit-cycles'], queryFn: () => api.audits.getAuditCycles() })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.departments.getDepartments() })
  const deptMap = departments.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {})

  return (
    <>
      <PageHeader
        title="Asset audit"
        subtitle="Structured verification cycles with auto-generated discrepancy reports."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> New audit cycle
          </Button>
        }
      />

      {showForm && <NewCycleForm onCancel={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-panel border border-line rounded-lg animate-pulse" />
          ))}
        </div>
      ) : cycles.length === 0 ? (
        <div className="bg-panel border border-line rounded-lg p-8 text-center">
          <p className="text-sm text-ink/60">No audit cycles yet.</p>
          <p className="text-xs text-ink/40 mt-1">Create a cycle to start verifying assets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} deptMap={deptMap} />
          ))}
        </div>
      )}
    </>
  )
}
