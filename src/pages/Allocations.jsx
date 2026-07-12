import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/client.js'

export default function Allocations() {
  const queryClient = useQueryClient()
  const [assetId, setAssetId] = useState('')
  const [userId, setUserId] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [conflict, setConflict] = useState(null)

  const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => api.allocations.list()
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.list()
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.org.employees.list()
  })

  const { data: transferRequests = [] } = useQuery({
    queryKey: ['transfers', 'requested'],
    queryFn: () => api.transfers.list('requested')
  })

  const allocateMutation = useMutation({
    mutationFn: api.allocations.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }) // update kpis
      setAssetId('')
      setUserId('')
      setExpectedReturnDate('')
      setConflict(null)
    },
    onError: (err) => {
      if (err.status === 409 && err.body?.detail) {
        setConflict(err.body.detail)
      } else {
        alert(err.message)
      }
    }
  })

  const returnMutation = useMutation({
    mutationFn: (id) => api.allocations.returnAsset(id, 'Returned via dashboard'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const transferCreateMutation = useMutation({
    mutationFn: api.transfers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      setConflict(null)
    }
  })

  const transferDecideMutation = useMutation({
    mutationFn: ({ id, action }) => api.transfers.decide(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    }
  })

  const allocate = (e) => {
    e.preventDefault()
    setConflict(null)
    if (!assetId || !userId) return
    allocateMutation.mutate({
      assetId: parseInt(assetId, 10),
      userId: parseInt(userId, 10),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined
    })
  }

  const requestTransfer = () => {
    if (!conflict) return
    transferCreateMutation.mutate({
      assetId: conflict.assetId,
      toUserId: parseInt(userId, 10),
      reason: 'Requested from allocations page'
    })
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
            disabled={allocateMutation.isPending}
          >
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={allocateMutation.isPending}
          >
            <option value="">Allocate to</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <Input 
            type="date" 
            value={expectedReturnDate} 
            onChange={(e) => setExpectedReturnDate(e.target.value)} 
            placeholder="Expected return"
            disabled={allocateMutation.isPending} 
          />
          <Button type="submit" disabled={allocateMutation.isPending}>
            {allocateMutation.isPending ? 'Allocating...' : 'Allocate'}
          </Button>
        </div>

        {conflict && (
          <div className="mt-3 flex items-center justify-between bg-status-lost/5 border border-status-lost/30 rounded-md px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-status-lost">
              <AlertTriangle size={16} />
              Asset #{conflict.assetId} is currently held by User #{conflict.userId}. Allocation blocked.
            </div>
            <Button size="sm" variant="secondary" onClick={requestTransfer} disabled={transferCreateMutation.isPending}>
              {transferCreateMutation.isPending ? 'Requesting...' : `Request transfer to selected employee`}
            </Button>
          </div>
        )}
      </form>

      {transferRequests.length > 0 && (
        <div className="bg-panel border border-line rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-3">Pending transfer requests</p>
          <div className="space-y-2">
            {transferRequests.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border border-line rounded-md px-3 py-2">
                <span>
                  <span className="font-mono-tag text-accent">{t.asset?.tag}</span> — {t.fromUser?.name} → {t.toUser?.name}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => transferDecideMutation.mutate({ id: t.id, action: 'approve' })} disabled={transferDecideMutation.isPending}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => transferDecideMutation.mutate({ id: t.id, action: 'reject' })} disabled={transferDecideMutation.isPending}>Reject</Button>
                </div>
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
            {allocationsLoading && <tr><td colSpan="6" className="p-4 text-center text-ink/60 text-sm">Loading allocations...</td></tr>}
            {!allocationsLoading && allocations.map((a) => {
              const overdue = new Date(a.expectedReturnDate) < new Date() && !a.returnedAt
              return (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <span className="font-mono-tag text-accent">{a.asset?.tag}</span>{' '}
                    <span className="text-ink/60">{a.asset?.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{a.user?.name}</td>
                  <td className="px-4 py-2.5 text-ink/60 font-mono-tag">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className={`px-4 py-2.5 font-mono-tag ${overdue ? 'text-status-lost' : 'text-ink/60'}`}>
                    {a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.returnedAt ? 'bg-status-retired/10 text-status-retired' : overdue ? 'bg-status-lost/10 text-status-lost' : 'bg-status-allocated/10 text-status-allocated'
                    }`}>
                      {a.returnedAt ? 'Returned' : overdue ? 'Overdue' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {!a.returnedAt && (
                      <button 
                        onClick={() => returnMutation.mutate(a.id)} 
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                        disabled={returnMutation.isPending}
                      >
                        Mark returned
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {!allocationsLoading && allocations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40 text-sm">No allocations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
