import { useEffect, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import CommandPalette from './CommandPalette.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const roleLabels = {
  admin: 'Admin',
  asset_manager: 'Asset manager',
  dept_head: 'Department head',
  employee: 'Employee',
}

export default function Layout() {
  const { user, setRoleForDemo } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={user.role} userName={user.name} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3 bg-panel border-b border-line">
          <button
            onClick={() => setPaletteOpen(true)}
            className="relative text-left group"
            aria-label="Open command palette"
          >
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <span className="flex items-center text-sm border border-line rounded-md pl-8 pr-2 py-1.5 w-80 bg-surface text-ink/40 group-hover:border-accent/50 transition-colors">
              Search asset, tag, serial...
              <kbd className="ml-auto text-[10px] font-mono-tag border border-line rounded px-1.5 py-0.5 text-ink/40 bg-panel">
                ⌘K
              </kbd>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <select
              value={user.role}
              onChange={(e) => setRoleForDemo(e.target.value)}
              className="text-sm border border-line rounded-md px-2 py-1.5 bg-surface"
              aria-label="Demo role switcher"
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} view
                </option>
              ))}
            </select>
            <Link to="/notifications" className="relative p-2 rounded-md hover:bg-surface inline-flex transition-colors">
              <Bell size={16} className="text-ink/70" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-status-lost rounded-full" />
            </Link>
          </div>
        </header>

        <main className="px-6 py-6 flex-1 overflow-y-auto bg-ambient">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
