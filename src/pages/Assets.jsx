import { useState } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { seedAssets, seedCategories, seedDepartments } from '../data/seedData.js'

export default function Assets() {
  const [assets, setAssets] = useState(seedAssets)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', serial: '', department: '', location: '', bookable: false })

  const filtered = assets.filter((a) => {
    const matchesQuery =
      !query ||
      a.tag.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.serial.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const registerAsset = (e) => {
    e.preventDefault()
    if (!form.name || !form.category) return
    const nextTagNum = assets.length + 1
    setAssets((prev) => [
      ...prev,
      {
        id: `a${prev.length + 1}`,
        tag: `AF-${String(nextTagNum).padStart(4, '0')}`,
        name: form.name,
        category: form.category,
        serial: form.serial || '—',
        department: form.department || '—',
        location: form.location || '—',
        status: 'available',
        bookable: form.bookable,
      },
    ])
    setForm({ name: '', category: '', serial: '', department: '', location: '', bookable: false })
    setShowForm(false)
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
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Category</option>
            {seedCategories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Serial number" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} />
          <select
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          >
            <option value="">Department (optional)</option>
            {seedDepartments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.bookable} onChange={(e) => setForm({ ...form, bookable: e.target.checked })} />
            Shared / bookable resource
          </label>
          <div className="col-span-3">
            <Button type="submit" size="sm">Save asset — tag auto-generated</Button>
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
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-line hover:bg-surface/60">
                <td className="px-4 py-2.5 font-mono-tag text-accent">{a.tag}</td>
                <td className="px-4 py-2.5 text-ink">{a.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.category}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.department}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.location}</td>
                <td className="px-4 py-2.5"><StatusPill status={a.status === 'under_maintenance' ? 'maintenance' : a.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/40 text-sm">No assets match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
