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
} from 'lucide-react'

const path = {
  dashboard: '/dashboard',
  assets: '/assets',
  myAssets: '/assets',
  allocations: '/allocations',
  requests: '/allocations',
  bookings: '/bookings',
  maintenance: '/maintenance',
  audit: '/audit',
  reports: '/reports',
  orgSetup: '/org-setup',
  settings: '/settings',
}

const navByRole = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'orgSetup', label: 'Organization setup', icon: Building2 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  dept_head: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  asset_manager: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'assets', label: 'Assets', icon: Package },
    { key: 'allocations', label: 'Allocations', icon: ArrowLeftRight },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench },
    { key: 'audit', label: 'Audit', icon: ClipboardCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ],
  employee: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'myAssets', label: 'My assets', icon: Package },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
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

  return (
    <aside className="w-56 bg-ink text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <span className="font-mono-tag text-status-available font-semibold text-lg">AssetFlow</span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === path[item.key]
          return (
            <Link
              key={item.key}
              to={path[item.key]}
              className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-md transition-colors ${
                active ? 'bg-status-available/20 text-status-available' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-status-available/30 flex items-center justify-center text-xs font-medium">
          {userName.split(' ').map((n) => n[0]).join('')}
        </div>
        <div>
          <p className="text-xs font-medium">{userName}</p>
          <p className="text-[11px] text-white/50">{roleTitle[role]}</p>
        </div>
      </div>
    </aside>
  )
}
