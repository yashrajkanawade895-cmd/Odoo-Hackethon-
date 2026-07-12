import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/index.js'

const stages = ['pending', 'approved', 'technician_assigned', 'in_progress', 'resolved']
const stageLabel = {
  pending: 'Pending',
  rejected: 'Rejected',
  approved: 'Approved',
  technician_assigned: 'Technician assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

function Pipeline({ status }) {
  if (status === 'rejected') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-status-lost/10 text-status-lost">Rejected</span>
  }
  const currentIndex = stages.indexOf(status)
  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${i <= currentIndex ? 'bg-status-available' : 'bg-line'}`}
            title={stageLabel[s]}
          />
          {i < stages.length - 1 && <div className={`w-4 h-px ${i < currentIndex ? 'bg-status-available' : 'bg-line'}`} />}
        </div>
      ))}
      <span className="text-xs text-ink/60 ml-2">{stageLabel[status]}</span>
    </div>
  )
}

export default function Maintenance() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canManage = user?.role === 'asset_manager' || user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ assetId: '', issue: '', priority: 'medium' })
  // Technician name entered inline per-request before the assign_technician action.
  const [technicians, setTechnicians] = useState({})

  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api.maintenance.getMaintenanceRequests(),
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.getAssets(),
  })

  const createMutation = useMutation({
    mutationFn: (v) => api.maintenance.createMaintenanceRequest(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      setForm({ assetId: '', issue: '', priority: 'medium' })
      setShowForm(false)
    },
  })

  const actMutation = useMutation({
    mutationFn: (v) => api.maintenance.actOnMaintenance(v.id, v.action, v.technician),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  const raise = (e) => {
    e.preventDefault()
    if (!form.assetId || !form.issue) return
    createMutation.mutate({ assetId: Number(form.assetId), issue: form.issue, priority: form.priority })
  }

  return (
    <>
      <PageHeader
        title="Maintenance management"
        subtitle="Route repairs through approval before work starts."
        action={<Button onClick={() => setShowForm((s) => !s)}>Raise request</Button>}
      />

      {showForm && (
        <form onSubmit={raise} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-4 gap-3">
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>
            ))}
          </select>
          <Input placeholder="Describe the issue" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="col-span-2" />
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
            <option value="urgent">Urgent priority</option>
          </select>
          <div className="col-span-4">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-panel border border-line rounded-lg p-4 h-[104px] animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-panel border border-line rounded-lg p-8 text-center text-sm text-status-lost">
          Couldn’t load maintenance requests. Please try again.
        </div>
      )}

      {!isLoading && !isError && requests.length === 0 && (
        <div className="bg-panel border border-line rounded-lg p-8 text-center text-sm text-ink/50">
          No maintenance requests yet.
        </div>
      )}

      {!isLoading && !isError && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((m) => (
            <div key={m.id} className="bg-panel border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono-tag text-accent">{m.asset?.tag}</span>{' '}
                  <span className="text-sm text-ink">{m.issue}</span>
                  {m.asset?.name && <span className="text-xs text-ink/50 ml-2">{m.asset.name}</span>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.priority === 'urgent' || m.priority === 'high' ? 'bg-status-lost/10 text-status-lost' : m.priority === 'medium' ? 'bg-status-maintenance/10 text-status-maintenance' : 'bg-status-retired/10 text-status-retired'
                }`}>
                  {m.priority} priority
                </span>
              </div>
              <p className="text-xs text-ink/50 mb-3">Raised by {m.raisedBy?.name || 'Unknown'}{m.technician ? ` · Technician: ${m.technician}` : ''}</p>
              <div className="flex items-center justify-between gap-3">
                <Pipeline status={m.status} />
                {canManage && (
                  <div className="flex items-center gap-2">
                    {m.status === 'pending' && (
                      <>
                        <Button size="sm" variant="secondary" disabled={actMutation.isPending} onClick={() => actMutation.mutate({ id: m.id, action: 'reject' })}>Reject</Button>
                        <Button size="sm" disabled={actMutation.isPending} onClick={() => actMutation.mutate({ id: m.id, action: 'approve' })}>Approve</Button>
                      </>
                    )}
                    {m.status === 'approved' && (
                      <>
                        <Input
                          placeholder="Technician name"
                          value={technicians[m.id] || ''}
                          onChange={(e) => setTechnicians((t) => ({ ...t, [m.id]: e.target.value }))}
                          className="h-8 w-40"
                        />
                        <Button
                          size="sm"
                          disabled={actMutation.isPending || !(technicians[m.id] || '').trim()}
                          onClick={() => actMutation.mutate({ id: m.id, action: 'assign_technician', technician: (technicians[m.id] || '').trim() })}
                        >
                          Assign technician
                        </Button>
                      </>
                    )}
                    {m.status === 'technician_assigned' && (
                      <Button size="sm" disabled={actMutation.isPending} onClick={() => actMutation.mutate({ id: m.id, action: 'start' })}>Start</Button>
                    )}
                    {m.status === 'in_progress' && (
                      <Button size="sm" disabled={actMutation.isPending} onClick={() => actMutation.mutate({ id: m.id, action: 'resolve' })}>Resolve</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
