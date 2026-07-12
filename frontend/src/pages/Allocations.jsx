import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/index.js'

export default function Allocations() {
  const qc = useQueryClient()
  const [assetId, setAssetId] = useState('')
  const [holderUserId, setHolderUserId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [conflict, setConflict] = useState(null)

  const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => api.allocations.getAllocations(),
  })
  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.getAssets(),
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.employees.getEmployees(),
  })
  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.transfers.getTransfers({ status: 'requested' }),
  })

  // Show all assets in the allocate dropdown (not just available) so an attempt to
  // allocate an already-held asset triggers the 409 conflict rule + Transfer flow.
  const sortedAssets = [...assets].sort((a, b) => (a.status === 'available' ? -1 : 1) - (b.status === 'available' ? -1 : 1))

  const allocateMutation = useMutation({
    mutationFn: (v) =>
      api.allocations.createAllocation({
        assetId: Number(v.assetId),
        holderUserId: Number(v.holderUserId),
        expectedReturnDate: v.expectedReturnDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
      setAssetId('')
      setHolderUserId('')
      setExpectedReturn('')
      setConflict(null)
    },
    onError: (err, v) => {
      if (err?.status === 409 && err?.body?.error === 'asset_already_allocated') {
        setConflict({
          assetId: Number(v.assetId),
          tag: v.tag,
          heldBy: err.body.held_by,
          toUserId: Number(v.holderUserId),
          toName: v.toName,
        })
      }
    },
  })

  const transferMutation = useMutation({
    mutationFn: (v) => api.transfers.createTransfer({ assetId: Number(v.assetId), toUserId: Number(v.toUserId) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      setConflict(null)
    },
  })

  const actOnTransferMutation = useMutation({
    mutationFn: ({ id, action }) => api.transfers.actOnTransfer(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['allocations'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, checkinNotes }) => api.allocations.returnAllocation(id, checkinNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allocations'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  const allocate = (e) => {
    e.preventDefault()
    setConflict(null)
    if (!assetId || !holderUserId) return
    const asset = assets.find((a) => a.id === Number(assetId))
    const employee = employees.find((emp) => emp.id === Number(holderUserId))
    allocateMutation.mutate({
      assetId,
      holderUserId,
      expectedReturnDate: expectedReturn,
      tag: asset?.tag || assetId,
      toName: employee?.name || 'selected employee',
    })
  }

  const requestTransfer = () => {
    if (!conflict) return
    transferMutation.mutate({ assetId: conflict.assetId, toUserId: conflict.toUserId })
  }

  const markReturned = (id) => {
    const checkinNotes = window.prompt('Check-in notes (optional):') || undefined
    returnMutation.mutate({ id, checkinNotes })
  }

  return (
    <>
      <PageHeader title="Allocation and transfer" subtitle="Manage who holds what, with explicit conflict rules." />

      <form onSubmit={allocate} className="bg-panel border border-line rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-ink mb-3">Allocate an asset</p>
        <div className="grid grid-cols-4 gap-3 items-start">
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            <option value="">Select asset</option>
            {sortedAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag} — {a.name}{a.status !== 'available' ? ` (${a.status})` : ''}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={holderUserId}
            onChange={(e) => setHolderUserId(e.target.value)}
          >
            <option value="">Allocate to</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
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
              Request transfer to {conflict.toName || 'selected employee'}
            </Button>
          </div>
        )}
      </form>

      {transfers.length > 0 && (
        <div className="bg-panel border border-line rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-3">Transfer requests</p>
          <div className="space-y-2">
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border border-line rounded-md px-3 py-2">
                <span>
                  <span className="font-mono-tag text-accent">{t.asset?.tag}</span> — {t.fromUser?.name} → {t.toUser?.name}
                </span>
                {t.status === 'requested' ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => actOnTransferMutation.mutate({ id: t.id, action: 'approve' })}>Approve transfer</Button>
                    <Button size="sm" variant="secondary" onClick={() => actOnTransferMutation.mutate({ id: t.id, action: 'reject' })}>Reject</Button>
                  </div>
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
            {allocationsLoading && (
              <tr className="border-t border-line">
                <td className="px-4 py-6 text-center text-ink/50" colSpan={6}>Loading allocations…</td>
              </tr>
            )}
            {!allocationsLoading && allocations.length === 0 && (
              <tr className="border-t border-line">
                <td className="px-4 py-6 text-center text-ink/50" colSpan={6}>No allocations yet.</td>
              </tr>
            )}
            {!allocationsLoading && allocations.map((a) => {
              const status = a.returnedAt ? 'returned' : 'active'
              const overdue = status === 'overdue'
              return (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <span className="font-mono-tag text-accent">{a.asset?.tag}</span>{' '}
                    <span className="text-ink/60">{a.asset?.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{a.holderUser?.name || a.holderDepartment?.name}</td>
                  <td className="px-4 py-2.5 text-ink/60 font-mono-tag">{a.allocatedAt ? a.allocatedAt.slice(0, 10) : '—'}</td>
                  <td className={`px-4 py-2.5 font-mono-tag ${overdue ? 'text-status-lost' : 'text-ink/60'}`}>{a.expectedReturnDate || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      overdue ? 'bg-status-lost/10 text-status-lost' : status === 'returned' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.returnedAt === null && (
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
