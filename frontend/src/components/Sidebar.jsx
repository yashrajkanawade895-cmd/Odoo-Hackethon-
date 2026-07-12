import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Users,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const path = {
  workspace: '/',
  directory: '/directory',
  projects: '/projects',
  assets: '/assets',
  myAssets: '/assets',
  allocations: '/allocations',
  requests: '/allocations',
  bookings: '/meetings',
  maintenance: '/maintenance',
  audit: '/audit',
  reports: '/reports',
  orgSetup: '/org-setup',
  settings: '/settings',
}

const navByRole = {
  admin: [
    { key: 'workspace', label: 'My Workspace', icon: LayoutDashboard },
    { key: 'directory', label: 'Directory', icon: Users },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Meetings & Resources', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'orgSetup', label: 'Organization setup', icon: Building2 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  dept_head: [
    { key: 'workspace', label: 'My Workspace', icon: LayoutDashboard },
    { key: 'directory', label: 'Directory', icon: Users },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Meetings & Resources', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  asset_manager: [
    { key: 'workspace', label: 'My Workspace', icon: LayoutDashboard },
    { key: 'directory', label: 'Directory', icon: Users },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Meetings & Resources', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  employee: [
    { key: 'workspace', label: 'My Workspace', icon: LayoutDashboard },
    { key: 'directory', label: 'Directory', icon: Users },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'myAssets', label: 'My assets', icon: Package },
    { key: 'bookings', label: 'Meetings & Resources', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'requests', label: 'Requests', icon: ArrowLeftRight },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
}

const roleTitle = {
  admin: 'Super admin',
  asset_manager: 'Asset manager',
  dept_head: 'Department head',
  employee: 'Employee',
}

export default function Sidebar({ role, userName = 'Admin User' }) {
  const items = navByRole[role]
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="w-60 bg-ink text-white flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <span className="font-mono-tag text-gradient-brand font-semibold text-lg tracking-tight">
          Bento
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === path[item.key]
          return (
            <Link
              key={item.key}
              to={path[item.key]}
              className={`relative w-full flex items-center gap-3 text-sm px-3 py-2 rounded-md transition-all duration-150 ${
                active
                  ? 'bg-status-available/15 text-status-available'
                  : 'text-white/65 hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-status-available shadow-[0_0_8px_#2B6E5E]" />
              )}
              <Icon size={16} className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 mb-4 px-3 py-3 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-status-available/25 flex items-center justify-center text-xs font-medium text-status-available shrink-0">
          {userName.split(' ').map((n) => n[0]).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{userName}</p>
          <p className="text-[11px] text-white/45 truncate">{roleTitle[role]}</p>
        </div>
        <button onClick={logout} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Log out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
