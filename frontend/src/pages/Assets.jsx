import { useState } from 'react'
import { Plus, PackageSearch } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatusPill from '../components/StatusPill.jsx'
import AssetDetailDrawer from '../components/AssetDetailDrawer.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { seedAssets, seedCategories, seedDepartments } from '../data/seedData.js'

const conditions = ['New', 'Good', 'Fair', 'Needs repair']

export default function Assets() {
  const [assets, setAssets] = useState(seedAssets)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    serial: '',
    department: '',
    location: '',
    bookable: false,
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'New',
  })

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
        acquisitionDate: form.acquisitionDate || '—',
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : 0,
        condition: form.condition,
      },
    ])
    setForm({
      name: '',
      category: '',
      serial: '',
      department: '',
      location: '',
      bookable: false,
      acquisitionDate: '',
      acquisitionCost: '',
      condition: 'New',
    })
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
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelectedAsset(a)}
                className="cursor-pointer border-t border-l-4 border-l-transparent border-line hover:border-l-accent hover:bg-surface/70 transition-all duration-150"
              >
                <td className="px-4 py-2.5 font-mono-tag text-accent">{a.tag}</td>
                <td className="px-4 py-2.5 text-ink">{a.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.category}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.department}</td>
                <td className="px-4 py-2.5 text-ink/70">{a.location}</td>
                <td className="px-4 py-2.5"><StatusPill status={a.status === 'under_maintenance' ? 'maintenance' : a.status} /></td>
                <td className="px-4 py-2.5 text-xs text-accent">View →</td>
              </tr>
            ))}
            {filtered.length === 0 && (
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
