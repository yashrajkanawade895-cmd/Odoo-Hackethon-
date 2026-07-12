import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client.js'

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
      <span className="text-xs text-ink/60 ml-2">{stageLabel[status] || status}</span>
    </div>
  )
}

const nextStage = {
  pending: 'approved',
  approved: 'technician_assigned',
  technician_assigned: 'in_progress',
  in_progress: 'resolved',
}

export default function Maintenance() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'medium' })

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => api.maintenance.list()
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.list()
  })

  const createMutation = useMutation({
    mutationFn: api.maintenance.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setForm({ assetId: '', description: '', priority: 'medium' })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.maintenance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const raise = (e) => {
    e.preventDefault()
    if (!form.assetId || !form.description) return
    createMutation.mutate({
      assetId: parseInt(form.assetId, 10),
      description: form.description,
      priority: form.priority,
    })
  }

  const advance = (r) => {
    const next = nextStage[r.status]
    if (!next) return
    updateMutation.mutate({
      id: r.id,
      data: {
        status: next,
        ...(next === 'technician_assigned' ? { technicianName: 'Assigned Technician' } : {})
      }
    })
  }

  const reject = (r) => {
    updateMutation.mutate({ id: r.id, data: { status: 'rejected' } })
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
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.assetId}
            onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            disabled={createMutation.isPending}
          >
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>
            ))}
          </select>
          <Input
            placeholder="Describe the issue"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-2"
            disabled={createMutation.isPending}
          />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            disabled={createMutation.isPending}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <div className="col-span-4">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-ink/60 p-4">Loading requests...</p>}
        {!isLoading && requests.length === 0 && (
          <p className="text-sm text-ink/40 p-4 text-center">No maintenance requests found.</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="bg-panel border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono-tag text-accent">{r.asset?.tag || `Asset #${r.assetId}`}</span>{' '}
                <span className="text-sm text-ink">{r.description}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                r.priority === 'high' ? 'bg-status-lost/10 text-status-lost'
                : r.priority === 'medium' ? 'bg-status-maintenance/10 text-status-maintenance'
                : 'bg-status-retired/10 text-status-retired'
              }`}>
                {r.priority} priority
              </span>
            </div>
            <p className="text-xs text-ink/50 mb-3">
              Raised by {r.requestedBy?.name || 'you'}
              {r.technicianName ? ` · Technician: ${r.technicianName}` : ''}
            </p>
            <div className="flex items-center justify-between">
              <Pipeline status={r.status} />
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => reject(r)} disabled={updateMutation.isPending}>Reject</Button>
                  <Button size="sm" onClick={() => advance(r)} disabled={updateMutation.isPending}>Approve</Button>
                </div>
              )}
              {r.status !== 'pending' && r.status !== 'resolved' && r.status !== 'rejected' && (
                <Button size="sm" variant="secondary" onClick={() => advance(r)} disabled={updateMutation.isPending}>
                  Advance stage
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
