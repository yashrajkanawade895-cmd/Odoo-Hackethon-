import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { seedMaintenanceRequests, seedAssets } from '../data/seedData.js'

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
  const [requests, setRequests] = useState(seedMaintenanceRequests)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ assetTag: '', issue: '', priority: 'medium' })

  const raise = (e) => {
    e.preventDefault()
    if (!form.assetTag || !form.issue) return
    setRequests((prev) => [
      ...prev,
      { id: `m${prev.length + 1}`, assetTag: form.assetTag, issue: form.issue, priority: form.priority, raisedBy: 'You', status: 'pending', technician: null },
    ])
    setForm({ assetTag: '', issue: '', priority: 'medium' })
    setShowForm(false)
  }

  const advance = (id) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const idx = stages.indexOf(r.status)
        const next = stages[Math.min(idx + 1, stages.length - 1)]
        return { ...r, status: next, technician: next === 'technician_assigned' ? 'Assigned technician' : r.technician }
      })
    )
  }

  const reject = (id) => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)))

  return (
    <>
      <PageHeader
        title="Maintenance management"
        subtitle="Route repairs through approval before work starts."
        action={<Button onClick={() => setShowForm((s) => !s)}>Raise request</Button>}
      />

      {showForm && (
        <form onSubmit={raise} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-4 gap-3">
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })}>
            <option value="">Select asset</option>
            {seedAssets.map((a) => (
              <option key={a.id} value={a.tag}>{a.tag} — {a.name}</option>
            ))}
          </select>
          <Input placeholder="Describe the issue" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="col-span-2" />
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <div className="col-span-4">
            <Button type="submit" size="sm">Submit request</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-panel border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono-tag text-accent">{r.assetTag}</span>{' '}
                <span className="text-sm text-ink">{r.issue}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                r.priority === 'high' ? 'bg-status-lost/10 text-status-lost' : r.priority === 'medium' ? 'bg-status-maintenance/10 text-status-maintenance' : 'bg-status-retired/10 text-status-retired'
              }`}>
                {r.priority} priority
              </span>
            </div>
            <p className="text-xs text-ink/50 mb-3">Raised by {r.raisedBy}{r.technician ? ` · Technician: ${r.technician}` : ''}</p>
            <div className="flex items-center justify-between">
              <Pipeline status={r.status} />
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => reject(r.id)}>Reject</Button>
                  <Button size="sm" onClick={() => advance(r.id)}>Approve</Button>
                </div>
              )}
              {r.status !== 'pending' && r.status !== 'resolved' && r.status !== 'rejected' && (
                <Button size="sm" variant="secondary" onClick={() => advance(r.id)}>Advance stage</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
