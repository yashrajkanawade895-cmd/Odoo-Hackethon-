import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/client.js'

const tabs = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Asset categories' },
  { key: 'employees', label: 'Employee directory' },
]

function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        status === 'active' ? 'bg-status-available/10 text-status-available' : 'bg-status-retired/10 text-status-retired'
      }`}
    >
      {status}
    </span>
  )
}

function DepartmentsTab() {
  const queryClient = useQueryClient()
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: api.org.departments.list
  })

  const createMutation = useMutation({
    mutationFn: api.org.departments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setForm({ name: '', headId: '', parentId: '' })
      setShowForm(false)
    }
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', headId: '', parentId: '' })

  const addDepartment = (e) => {
    e.preventDefault()
    if (!form.name) return
    createMutation.mutate({
      name: form.name,
      headId: form.headId ? parseInt(form.headId) : undefined,
      parentId: form.parentId ? parseInt(form.parentId) : undefined
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={14} /> New department
        </Button>
      </div>
      {showForm && (
        <form onSubmit={addDepartment} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-3 gap-3">
          <Input placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={createMutation.isPending} />
          <Input placeholder="Head ID (optional)" type="number" value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value })} disabled={createMutation.isPending} />
          <Input placeholder="Parent Dept ID (optional)" type="number" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} disabled={createMutation.isPending} />
          <div className="col-span-3">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save department'}
            </Button>
          </div>
        </form>
      )}
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">ID</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Head</th>
              <th className="text-left px-4 py-2 font-medium">Parent</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan="5" className="p-4 text-center text-ink/60">Loading...</td></tr>}
            {departments.map((d) => (
              <tr key={d.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50">#{d.id}</td>
                <td className="px-4 py-2.5 text-ink">{d.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{d.head?.name || '—'}</td>
                <td className="px-4 py-2.5 text-ink/70">{d.parent?.name || '—'}</td>
                <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategoriesTab() {
  const queryClient = useQueryClient()
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.org.categories.list
  })

  const createMutation = useMutation({
    mutationFn: api.org.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setForm({ name: '', customFields: '' })
      setShowForm(false)
    }
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', customFields: '' })

  const addCategory = (e) => {
    e.preventDefault()
    if (!form.name) return
    let parsedFields = {}
    if (form.customFields) {
      try { parsedFields = JSON.parse(form.customFields) } catch(err) { /* ignore or warn */ }
    }
    createMutation.mutate({ name: form.name, customFields: parsedFields })
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={14} /> New category
        </Button>
      </div>
      {showForm && (
        <form onSubmit={addCategory} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
          <Input placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={createMutation.isPending} />
          <Input placeholder='Custom fields (JSON)' value={form.customFields} onChange={(e) => setForm({ ...form, customFields: e.target.value })} disabled={createMutation.isPending} />
          <div className="col-span-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save category'}
            </Button>
          </div>
        </form>
      )}
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">ID</th>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Custom fields</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan="3" className="p-4 text-center text-ink/60">Loading...</td></tr>}
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50">#{c.id}</td>
                <td className="px-4 py-2.5 text-ink">{c.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{JSON.stringify(c.customFields || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const roleLabel = { admin: 'Admin', asset_manager: 'Asset manager', dept_head: 'Department head', employee: 'Employee' }

function EmployeesTab() {
  const queryClient = useQueryClient()
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.org.employees.list()
  })

  const promoteMutation = useMutation({
    mutationFn: ({ id, role }) => api.org.employees.promote(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })

  const promote = (id, role) => {
    if (window.confirm(`Are you sure you want to promote this user to ${roleLabel[role]}?`)) {
      promoteMutation.mutate({ id, role })
    }
  }

  return (
    <div className="bg-panel border border-line rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface text-ink/60 text-xs">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Name</th>
            <th className="text-left px-4 py-2 font-medium">Email</th>
            <th className="text-left px-4 py-2 font-medium">Department</th>
            <th className="text-left px-4 py-2 font-medium">Role</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-left px-4 py-2 font-medium">Promote</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan="6" className="p-4 text-center text-ink/60">Loading...</td></tr>}
          {employees.map((e) => (
            <tr key={e.id} className="border-t border-line">
              <td className="px-4 py-2.5 text-ink">{e.name}</td>
              <td className="px-4 py-2.5 text-ink/70">{e.email}</td>
              <td className="px-4 py-2.5 text-ink/70">{e.department?.name || '—'}</td>
              <td className="px-4 py-2.5 text-ink/70">{roleLabel[e.role]}</td>
              <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
              <td className="px-4 py-2.5">
                {e.role === 'employee' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => promote(e.id, 'dept_head')} 
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                      disabled={promoteMutation.isPending}
                    >
                      Make dept head
                    </button>
                    <button 
                      onClick={() => promote(e.id, 'asset_manager')} 
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                      disabled={promoteMutation.isPending}
                    >
                      Make asset manager
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-ink/40">Already promoted</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OrgSetup() {
  const [tab, setTab] = useState('departments')

  return (
    <>
      <PageHeader title="Organization setup" subtitle="Master data everything else depends on. Admin only." />
      <div className="flex gap-1 mb-4 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2 border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-accent text-accent font-medium' : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'departments' && <DepartmentsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'employees' && <EmployeesTab />}
    </>
  )
}
