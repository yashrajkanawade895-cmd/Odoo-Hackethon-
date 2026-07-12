import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client.js'

const resultStyle = {
  pending: 'bg-line text-ink/60',
  verified: 'bg-status-available/10 text-status-available',
  missing: 'bg-status-lost/10 text-status-lost',
  damaged: 'bg-status-maintenance/10 text-status-maintenance',
}

export default function Audit() {
  const queryClient = useQueryClient()

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ['audit-cycles'],
    queryFn: api.audits.list
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, result }) => api.audits.updateItem(itemId, { result }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit-cycles'] })
  })

  const closeMutation = useMutation({
    mutationFn: api.audits.close,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit-cycles'] })
  })

  const markItem = (itemId, result) => {
    updateItemMutation.mutate({ itemId, result })
  }

  const closeCycle = (cycleId) => {
    closeMutation.mutate(cycleId)
  }

  return (
    <>
      <PageHeader title="Asset audit" subtitle="Structured verification cycles with auto-generated discrepancy reports." />

      <div className="space-y-4">
        {isLoading && <p className="text-sm text-ink/60 p-4">Loading audit cycles...</p>}
        {!isLoading && cycles.length === 0 && (
          <p className="text-sm text-ink/40 p-4 text-center">No audit cycles found.</p>
        )}
        {cycles.map((cycle) => {
          const items = cycle.items || []
          const discrepancies = items.filter((i) => i.result === 'missing' || i.result === 'damaged')
          const allMarked = items.length > 0 && items.every((i) => i.result !== 'pending')

          return (
            <div key={cycle.id} className="bg-panel border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-ink">{cycle.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  cycle.status === 'open'
                    ? 'bg-status-allocated/10 text-status-allocated'
                    : 'bg-status-retired/10 text-status-retired'
                }`}>
                  {cycle.status}
                </span>
              </div>
              <p className="text-xs text-ink/50 mb-3">
                {cycle.scope} · {new Date(cycle.startDate).toLocaleDateString()} – {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : 'ongoing'}
                {cycle.auditors?.length > 0 && ` · Auditors: ${cycle.auditors.map(a => a.name || `#${a.id}`).join(', ')}`}
              </p>

              <div className="space-y-2 mb-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border border-line rounded-md px-3 py-2">
                    <span className="text-sm">
                      <span className="font-mono-tag text-accent">{item.asset?.tag}</span>{' '}
                      <span className="text-ink/70">{item.asset?.name}</span>
                    </span>
                    {cycle.status === 'open' ? (
                      <div className="flex gap-1">
                        {['verified', 'missing', 'damaged'].map((r) => (
                          <button
                            key={r}
                            onClick={() => markItem(item.id, r)}
                            disabled={updateItemMutation.isPending}
                            className={`text-xs px-2 py-1 rounded-full capitalize ${
                              item.result === r ? resultStyle[r] : 'text-ink/40 hover:bg-surface'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${resultStyle[item.result] || resultStyle.pending}`}>
                        {item.result}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {discrepancies.length > 0 && (
                <div className="bg-status-lost/5 border border-status-lost/30 rounded-md px-3 py-2 mb-3">
                  <p className="text-xs font-medium text-status-lost mb-1">Discrepancy report ({discrepancies.length})</p>
                  {discrepancies.map((d) => (
                    <p key={d.id} className="text-xs text-ink/70">
                      <span className="font-mono-tag">{d.asset?.tag}</span> — flagged {d.result}
                    </p>
                  ))}
                </div>
              )}

              {cycle.status === 'open' && (
                <Button
                  size="sm"
                  disabled={!allMarked || closeMutation.isPending}
                  onClick={() => closeCycle(cycle.id)}
                >
                  {closeMutation.isPending ? 'Closing...' : 'Close audit cycle'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
