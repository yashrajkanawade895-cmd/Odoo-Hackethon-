import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { api } from '../api/index.js'

const tabs = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Asset categories' },
  { key: 'employees', label: 'Employee directory' },
]

const selectClass =
  'flex h-9 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50'

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
  const qc = useQueryClient()
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.departments.getDepartments(),
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.employees.getEmployees(),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', headId: '', parentId: '' })

  const createDepartment = useMutation({
    mutationFn: (v) => api.departments.createDepartment(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      setForm({ name: '', headId: '', parentId: '' })
      setShowForm(false)
    },
  })

  const addDepartment = (e) => {
    e.preventDefault()
    if (!form.name) return
    createDepartment.mutate({
      name: form.name,
      headId: form.headId ? Number(form.headId) : undefined,
      parentId: form.parentId ? Number(form.parentId) : undefined,
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
          <Input placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={selectClass} value={form.headId} onChange={(e) => setForm({ ...form, headId: e.target.value })}>
            <option value="">Department head (optional)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <select className={selectClass} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <option value="">Parent department (optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="col-span-3">
            <Button type="submit" size="sm" disabled={createDepartment.isPending}>
              {createDepartment.isPending ? 'Saving…' : 'Save department'}
            </Button>
          </div>
        </form>
      )}
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Head</th>
              <th className="text-left px-4 py-2 font-medium">Parent</th>
              <th className="text-left px-4 py-2 font-medium">Members</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50" colSpan={5}>Loading departments…</td>
              </tr>
            )}
            {!isLoading && departments.length === 0 && (
              <tr className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50" colSpan={5}>No departments yet.</td>
              </tr>
            )}
            {!isLoading &&
              departments.map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink">{d.name}</td>
                  <td className="px-4 py-2.5 text-ink/70">{d.head?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-ink/70">{d.parent?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-ink/70">{d._count?.members ?? 0}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCustomFields(customFields) {
  if (!customFields || typeof customFields !== 'object') return '—'
  const entries = Object.entries(customFields)
  if (entries.length === 0) return '—'
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
}

function CategoriesTab() {
  const qc = useQueryClient()
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getCategories(),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', fieldKey: '', fieldValue: '' })

  const createCategory = useMutation({
    mutationFn: (v) => api.categories.createCategory(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setForm({ name: '', fieldKey: '', fieldValue: '' })
      setShowForm(false)
    },
  })

  const addCategory = (e) => {
    e.preventDefault()
    if (!form.name) return
    const customFields = form.fieldKey && form.fieldValue ? { [form.fieldKey]: form.fieldValue } : undefined
    createCategory.mutate({ name: form.name, customFields })
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={14} /> New category
        </Button>
      </div>
      {showForm && (
        <form onSubmit={addCategory} className="bg-panel border border-line rounded-lg p-4 mb-4 grid grid-cols-3 gap-3">
          <Input placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Custom field name (optional, e.g. warranty_months)" value={form.fieldKey} onChange={(e) => setForm({ ...form, fieldKey: e.target.value })} />
          <Input placeholder="Custom field value (optional, e.g. 24)" value={form.fieldValue} onChange={(e) => setForm({ ...form, fieldValue: e.target.value })} />
          <div className="col-span-3">
            <Button type="submit" size="sm" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Saving…' : 'Save category'}
            </Button>
          </div>
        </form>
      )}
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Custom field</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50" colSpan={2}>Loading categories…</td>
              </tr>
            )}
            {!isLoading && categories.length === 0 && (
              <tr className="border-t border-line">
                <td className="px-4 py-2.5 text-ink/50" colSpan={2}>No categories yet.</td>
              </tr>
            )}
            {!isLoading &&
              categories.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink">{c.name}</td>
                  <td className="px-4 py-2.5 text-ink/70">{formatCustomFields(c.customFields)}</td>
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
  const qc = useQueryClient()
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.employees.getEmployees(),
  })

  const promoteMutation = useMutation({
    mutationFn: ({ id, role }) => api.employees.updateEmployeeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })

  const promote = (id, role) => promoteMutation.mutate({ id, role })

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
          {isLoading && (
            <tr className="border-t border-line">
              <td className="px-4 py-2.5 text-ink/50" colSpan={6}>Loading employees…</td>
            </tr>
          )}
          {!isLoading && employees.length === 0 && (
            <tr className="border-t border-line">
              <td className="px-4 py-2.5 text-ink/50" colSpan={6}>No employees yet.</td>
            </tr>
          )}
          {!isLoading &&
            employees.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink">{e.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{e.email}</td>
                <td className="px-4 py-2.5 text-ink/70">{e.department?.name || '—'}</td>
                <td className="px-4 py-2.5 text-ink/70">{roleLabel[e.role] || e.role}</td>
                <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-2.5">
                  {e.role === 'employee' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => promote(e.id, 'dept_head')}
                        disabled={promoteMutation.isPending}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
                      >
                        Make dept head
                      </button>
                      <button
                        onClick={() => promote(e.id, 'asset_manager')}
                        disabled={promoteMutation.isPending}
                        className="text-xs text-accent hover:underline disabled:opacity-50"
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
