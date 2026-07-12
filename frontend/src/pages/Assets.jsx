import { useState } from 'react'
import { Plus, PackageSearch } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import StatusPill from '../components/StatusPill.jsx'
import AssetDetailDrawer from '../components/AssetDetailDrawer.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/index.js'

const conditions = ['New', 'Good', 'Fair', 'Needs repair']

const emptyForm = {
  name: '',
  categoryId: '',
  serialNumber: '',
  location: '',
  bookable: false,
  acquisitionDate: '',
  acquisitionCost: '',
  condition: 'New',
}

export default function Assets() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const qc = useQueryClient()

  const { data: assets, isLoading, isError, error } = useQuery({
    queryKey: ['assets', query, statusFilter],
    queryFn: () =>
      api.assets.getAssets({
        q: query || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getCategories(),
  })

  const createMutation = useMutation({
    mutationFn: (vars) => api.assets.createAsset(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      setForm(emptyForm)
      setShowForm(false)
    },
  })

  const rows = assets || []

  const registerAsset = (e) => {
    e.preventDefault()
    if (!form.name || !form.categoryId) return
    createMutation.mutate({
      name: form.name,
      categoryId: Number(form.categoryId),
      serialNumber: form.serialNumber,
      location: form.location,
      condition: form.condition.toLowerCase(),
      isBookable: form.bookable,
      acquisitionDate: form.acquisitionDate,
      acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : 0,
    })
  }

  return (
    <>
      <PageHeader
        title="Asset directory"
        subtitle="Register and track assets through their full lifecycle."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> Register asset
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={registerAsset} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-3 gap-3">
          <Input placeholder="Asset name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Category</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Serial number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
          >
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input
            type="date"
            placeholder="Acquisition date"
            value={form.acquisitionDate}
            onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
          />
          <Input
            type="number"
            min="0"
            placeholder="Acquisition cost (₹)"
            value={form.acquisitionCost}
            onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.bookable} onChange={(e) => setForm({ ...form, bookable: e.target.checked })} />
            Shared / bookable resource
          </label>
          <p className="col-span-3 text-xs text-ink/40 -mt-1">
            Photo/document upload isn't wired to storage yet in this demo — cost is tracked for reporting only, not linked to accounting.
          </p>
          {createMutation.isError && (
            <p className="col-span-3 text-xs text-status-lost -mt-1">
              {createMutation.error?.body?.error || createMutation.error?.message || 'Could not save asset.'}
            </p>
          )}
          <div className="col-span-3">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Save asset — tag auto-generated'}
            </Button>
          </div>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by tag, serial, or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-72"
        />
        <select
          className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="reserved">Reserved</option>
          <option value="under_maintenance">Under maintenance</option>
          <option value="lost">Lost</option>
          <option value="retired">Retired</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Tag</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Department</th>
              <th className="text-left px-4 py-2 font-medium">Location</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-line">
                  <td colSpan={7} className="px-4 py-2.5">
                    <div className="h-5 bg-surface rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {!isLoading && isError && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-status-lost">
                      <PackageSearch size={18} />
                    </span>
                    <p className="text-sm text-ink/60">Couldn't load assets.</p>
                    <p className="text-xs text-ink/35">{error?.body?.error || error?.message || 'Please try again.'}</p>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelectedAsset(a)}
                className="cursor-pointer border-t border-l-4 border-l-transparent border-line hover:border-l-accent hover:bg-surface/70 transition-all duration-150"
              >
                <td className="px-4 py-2.5 font-mono-tag text-accent">{a.tag}</td>
                <td className="px-4 py-2.5 text-ink">{a.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.category?.name || '—'}</td>
                <td className="px-4 py-2.5 text-ink/70">—</td>
                <td className="px-4 py-2.5 text-ink/70">{a.location || '—'}</td>
                <td className="px-4 py-2.5"><StatusPill status={a.status === 'under_maintenance' ? 'maintenance' : a.status} /></td>
                <td className="px-4 py-2.5 text-xs text-accent">View →</td>
              </tr>
            ))}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-ink/30">
                      <PackageSearch size={18} />
                    </span>
                    <p className="text-sm text-ink/50">No assets match your search.</p>
                    <p className="text-xs text-ink/35">Try a different tag, name, or status filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AssetDetailDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </>
  )
}
