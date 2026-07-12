import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { seedAuditCycles } from '../data/seedData.js'

const resultStyle = {
  pending: 'bg-line text-ink/60',
  verified: 'bg-status-available/10 text-status-available',
  missing: 'bg-status-lost/10 text-status-lost',
  damaged: 'bg-status-maintenance/10 text-status-maintenance',
}

export default function Audit() {
  const [cycles, setCycles] = useState(seedAuditCycles)

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

  return (
    <>
      <PageHeader title="Asset audit" subtitle="Structured verification cycles with auto-generated discrepancy reports." />

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
