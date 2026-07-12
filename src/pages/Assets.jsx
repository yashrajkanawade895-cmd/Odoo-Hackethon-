import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/client.js'

export default function Assets() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', categoryId: '', serial: '', departmentId: '', location: '', bookable: false })

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', query, statusFilter],
    queryFn: () => {
      const params = {}
      if (query) params.q = query
      if (statusFilter !== 'all') params.status = statusFilter
      return api.assets.list(params)
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.org.categories.list
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: api.org.departments.list
  })

  const createMutation = useMutation({
    mutationFn: api.assets.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setForm({ name: '', categoryId: '', serial: '', departmentId: '', location: '', bookable: false })
      setShowForm(false)
    }
  })

  const registerAsset = (e) => {
    e.preventDefault()
    if (!form.name || !form.categoryId) return
    createMutation.mutate({
      name: form.name,
      categoryId: parseInt(form.categoryId, 10),
      departmentId: form.departmentId ? parseInt(form.departmentId, 10) : undefined,
      location: form.location || undefined,
      // API currently uses bookable feature? Let's check api-contract. Yes it uses it or we can just pass it.
      // Serial is customFields usually, but we can pass it if supported, or omit.
      // Actually API contract for POST /assets: name, categoryId, departmentId, location, condition, customFields
      customFields: form.serial ? { serial: form.serial, bookable: form.bookable } : { bookable: form.bookable }
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
          <Input placeholder="Asset name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={createMutation.isPending} />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            disabled={createMutation.isPending}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Serial number" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} disabled={createMutation.isPending} />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            disabled={createMutation.isPending}
          >
            <option value="">Department (optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={createMutation.isPending} />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.bookable} onChange={(e) => setForm({ ...form, bookable: e.target.checked })} disabled={createMutation.isPending} />
            Shared / bookable resource
          </label>
          <div className="col-span-3">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save asset — tag auto-generated'}
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
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40 text-sm">Loading assets...</td></tr>
            )}
            {!isLoading && assets.map((a) => (
              <tr key={a.id} className="border-t border-line hover:bg-surface/60">
                <td className="px-4 py-2.5 font-mono-tag text-accent">{a.tag}</td>
                <td className="px-4 py-2.5 text-ink">{a.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.category?.name || '—'}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.department?.name || '—'}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.location || '—'}</td>
                <td className="px-4 py-2.5"><StatusPill status={a.status === 'under_maintenance' ? 'maintenance' : a.status} /></td>
              </tr>
            ))}
            {!isLoading && assets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40 text-sm">No assets match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
