import { useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { seedAuditCycles, seedAssets, seedEmployees, seedDepartments } from '../data/seedData.js'

const resultStyle = {
  pending: 'bg-line text-ink/60',
  verified: 'bg-status-available/10 text-status-available',
  missing: 'bg-status-lost/10 text-status-lost',
  damaged: 'bg-status-maintenance/10 text-status-maintenance',
}

function NewCycleForm({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [scope, setScope] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [auditors, setAuditors] = useState([])
  const [assetTags, setAssetTags] = useState([])

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const submit = (e) => {
    e.preventDefault()
    if (!name || !scope || !startDate || !endDate || auditors.length === 0 || assetTags.length === 0) return
    onCreate({
      id: `ac${Date.now()}`,
      name,
      scope,
      dateRange: `${startDate} to ${endDate}`,
      status: 'open',
      auditors,
      items: assetTags.map((tag) => {
        const asset = seedAssets.find((a) => a.tag === tag)
        return { assetTag: tag, assetName: asset?.name || tag, result: 'pending' }
      }),
    })
  }

  return (
    <form onSubmit={submit} className="bg-panel border border-line rounded-lg p-4 mb-4">
      <p className="text-sm font-medium text-ink mb-3">New audit cycle</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input placeholder="Cycle name (e.g. Q3 HQ Floor 3 Audit)" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">Scope (department / location)</option>
          {seedDepartments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <p className="text-xs font-medium text-ink/60 mb-1.5">Assign auditors</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {seedEmployees.map((e) => (
          <button
            type="button"
            key={e.id}
            onClick={() => toggle(auditors, setAuditors, e.name)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              auditors.includes(e.name) ? 'bg-status-available/10 border-status-available text-status-available' : 'border-line text-ink/60 hover:border-accent'
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-ink/60 mb-1.5">Assets in scope</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {seedAssets.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => toggle(assetTags, setAssetTags, a.tag)}
            className={`text-xs font-mono-tag px-2.5 py-1 rounded-full border transition-colors ${
              assetTags.includes(a.tag) ? 'bg-status-available/10 border-status-available text-status-available' : 'border-line text-ink/60 hover:border-accent'
            }`}
          >
            {a.tag}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">Create cycle</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default function Audit() {
  const [cycles, setCycles] = useState(seedAuditCycles)
  const [showForm, setShowForm] = useState(false)

  const markItem = (cycleId, assetTag, result) => {
    setCycles((prev) =>
      prev.map((c) =>
        c.id !== cycleId
          ? c
          : { ...c, items: c.items.map((i) => (i.assetTag === assetTag ? { ...i, result } : i)) }
      )
    )
  }

  const closeCycle = (cycleId) => {
    setCycles((prev) => prev.map((c) => (c.id === cycleId ? { ...c, status: 'closed' } : c)))
  }

  const createCycle = (cycle) => {
    setCycles((prev) => [cycle, ...prev])
    setShowForm(false)
  }

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

      {showForm && <NewCycleForm onCreate={createCycle} onCancel={() => setShowForm(false)} />}

      <div className="space-y-4">
        {cycles.map((cycle) => {
          const discrepancies = cycle.items.filter((i) => i.result === 'missing' || i.result === 'damaged')
          const allMarked = cycle.items.every((i) => i.result !== 'pending')

          return (
            <div key={cycle.id} className="bg-panel border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-ink">{cycle.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cycle.status === 'open' ? 'bg-status-allocated/10 text-status-allocated' : 'bg-status-retired/10 text-status-retired'}`}>
                  {cycle.status}
                </span>
              </div>
              <p className="text-xs text-ink/50 mb-3">{cycle.scope} · {cycle.dateRange} · Auditors: {cycle.auditors.join(', ')}</p>

              <div className="space-y-2 mb-3">
                {cycle.items.map((item) => (
                  <div key={item.assetTag} className="flex items-center justify-between border border-line rounded-md px-3 py-2">
                    <span className="text-sm">
                      <span className="font-mono-tag text-accent">{item.assetTag}</span> <span className="text-ink/70">{item.assetName}</span>
                    </span>
                    {cycle.status === 'open' ? (
                      <div className="flex gap-1">
                        {['verified', 'missing', 'damaged'].map((r) => (
                          <button
                            key={r}
                            onClick={() => markItem(cycle.id, item.assetTag, r)}
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

              {discrepancies.length > 0 && (
                <div className="bg-status-lost/5 border border-status-lost/30 rounded-md px-3 py-2 mb-3">
                  <p className="text-xs font-medium text-status-lost mb-1">Discrepancy report ({discrepancies.length})</p>
                  {discrepancies.map((d) => (
                    <p key={d.assetTag} className="text-xs text-ink/70">
                      <span className="font-mono-tag">{d.assetTag}</span> — flagged {d.result}
                      {d.result === 'missing' && <span className="text-ink/40"> · status will move to Lost on close</span>}
                    </p>
                  ))}
                </div>
              )}

              {cycle.status === 'open' && (
                <Button size="sm" disabled={!allMarked} onClick={() => closeCycle(cycle.id)}>
                  Close audit cycle
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
