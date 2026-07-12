import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { seedAllocations, seedAssets, seedEmployees } from '../data/seedData.js'

export default function Allocations() {
  const [allocations, setAllocations] = useState(seedAllocations)
  const [assets] = useState(seedAssets)
  const [assetTag, setAssetTag] = useState('')
  const [holder, setHolder] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [conflict, setConflict] = useState(null)
  const [transferRequests, setTransferRequests] = useState([])

  const activelyHeldBy = (tag) => allocations.find((a) => a.assetTag === tag && a.status !== 'returned')

  const allocate = (e) => {
    e.preventDefault()
    setConflict(null)
    if (!assetTag || !holder) return

    const existing = activelyHeldBy(assetTag)
    if (existing) {
      // Conflict rule: block double allocation, offer Transfer Request instead.
      setConflict({ tag: assetTag, heldBy: existing.holder })
      return
    }

    const asset = assets.find((a) => a.tag === assetTag)
    setAllocations((prev) => [
      ...prev,
      {
        id: `al${prev.length + 1}`,
        assetTag,
        assetName: asset?.name || assetTag,
        holder,
        allocatedOn: new Date().toISOString().slice(0, 10),
        expectedReturn: expectedReturn || '—',
        status: 'active',
      },
    ])
    setAssetTag('')
    setHolder('')
    setExpectedReturn('')
  }

  const requestTransfer = () => {
    setTransferRequests((prev) => [
      ...prev,
      { id: `tr${prev.length + 1}`, assetTag: conflict.tag, from: conflict.heldBy, to: holder, status: 'requested' },
    ])
    setConflict(null)
  }

  const approveTransfer = (id) => {
    const req = transferRequests.find((t) => t.id === id)
    if (!req) return
    setTransferRequests((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t)))
    setAllocations((prev) =>
      prev.map((a) => (a.assetTag === req.assetTag && a.status !== 'returned' ? { ...a, status: 'returned' } : a))
    )
    setAllocations((prev) => [
      ...prev,
      {
        id: `al${prev.length + 1}`,
        assetTag: req.assetTag,
        assetName: assets.find((a) => a.tag === req.assetTag)?.name || req.assetTag,
        holder: req.to,
        allocatedOn: new Date().toISOString().slice(0, 10),
        expectedReturn: '—',
        status: 'active',
      },
    ])
  }

  const markReturned = (id) => {
    setAllocations((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'returned' } : a)))
  }

  return (
    <>
      <PageHeader title="Allocation and transfer" subtitle="Manage who holds what, with explicit conflict rules." />

      <form onSubmit={allocate} className="bg-panel border border-line rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-ink mb-3">Allocate an asset</p>
        <div className="grid grid-cols-4 gap-3 items-start">
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
          >
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.tag}>{a.tag} — {a.name}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          >
            <option value="">Allocate to</option>
            {seedEmployees.map((e) => (
              <option key={e.id} value={e.name}>{e.name}</option>
            ))}
          </select>
          <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} placeholder="Expected return" />
          <Button type="submit">Allocate</Button>
        </div>

        {conflict && (
          <div className="mt-3 flex items-center justify-between bg-status-lost/5 border border-status-lost/30 rounded-md px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-status-lost">
              <AlertTriangle size={16} />
              {conflict.tag} is currently held by <span className="font-medium">{conflict.heldBy}</span>. Allocation blocked.
            </div>
            <Button size="sm" variant="secondary" onClick={requestTransfer}>
              Request transfer to {holder || 'selected employee'}
            </Button>
          </div>
        )}
      </form>

      {transferRequests.length > 0 && (
        <div className="bg-panel border border-line rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-3">Transfer requests</p>
          <div className="space-y-2">
            {transferRequests.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border border-line rounded-md px-3 py-2">
                <span>
                  <span className="font-mono-tag text-accent">{t.assetTag}</span> — {t.from} → {t.to}
                </span>
                {t.status === 'requested' ? (
                  <Button size="sm" onClick={() => approveTransfer(t.id)}>Approve transfer</Button>
                ) : (
                  <span className="text-xs text-status-available">Approved — history updated</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Asset</th>
              <th className="text-left px-4 py-2 font-medium">Holder</th>
              <th className="text-left px-4 py-2 font-medium">Allocated</th>
              <th className="text-left px-4 py-2 font-medium">Expected return</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => {
              const overdue = a.status === 'overdue'
              return (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <span className="font-mono-tag text-accent">{a.assetTag}</span>{' '}
                    <span className="text-ink/60">{a.assetName}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{a.holder}</td>
                  <td className="px-4 py-2.5 text-ink/60 font-mono-tag">{a.allocatedOn}</td>
                  <td className={`px-4 py-2.5 font-mono-tag ${overdue ? 'text-status-lost' : 'text-ink/60'}`}>{a.expectedReturn}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      overdue ? 'bg-status-lost/10 text-status-lost' : a.status === 'returned' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.status !== 'returned' && (
                      <button onClick={() => markReturned(a.id)} className="text-xs text-accent hover:underline">
                        Mark returned
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
