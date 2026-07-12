import { useEffect, useState, useRef } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Search, Bell, X, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from './Sidebar.jsx'
import CommandPalette from './CommandPalette.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/index.js'

const roleLabels = {
  admin: 'Admin',
  asset_manager: 'Asset manager',
  dept_head: 'Department head',
  employee: 'Employee',
}

export default function Layout() {
  const { user, setRoleForDemo } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const qc = useQueryClient()
  
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getNotifications(),
    refetchInterval: 30000,
  })
  const notifications = notifData?.notifications ?? []
  const unreadCount = notifData?.unreadCount ?? 0

  const markRead = useMutation({
    mutationFn: (id) => api.notifications.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setBellOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
            {import.meta.env.VITE_USE_MOCKS === 'true' && (
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
            )}
            
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 rounded-md hover:bg-surface inline-flex transition-colors"
                aria-label="Notifications"
              >
                <Bell size={16} className="text-ink/70" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium bg-status-lost text-white rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-panel border border-line rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <p className="text-sm font-medium text-ink">Notifications</p>
                    <button onClick={() => setBellOpen(false)} className="p-1 rounded hover:bg-surface">
                      <X size={14} className="text-ink/40" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-ink/50 text-center py-6">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => !n.isRead && markRead.mutate(n.id)}
                          className={`w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-surface/50 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-accent/5' : ''}`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-accent' : 'bg-line'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink truncate">{n.message}</p>
                            <p className="text-xs text-ink/40 mt-0.5 font-mono-tag">{new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          </div>
                          {!n.isRead && (
                            <Check size={14} className="text-accent shrink-0 mt-1" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setBellOpen(false)}
                    className="block text-center text-xs text-accent hover:underline py-2.5 border-t border-line bg-surface/30"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

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
