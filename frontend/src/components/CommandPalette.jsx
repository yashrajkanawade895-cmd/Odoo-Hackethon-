import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  Search,
  CornerDownLeft,
} from 'lucide-react'
import { seedAssets } from '../data/seedData.js'

const pages = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'Go to' },
  { label: 'Assets', path: '/assets', icon: Package, group: 'Go to' },
  { label: 'Allocations', path: '/allocations', icon: ArrowLeftRight, group: 'Go to' },
  { label: 'Bookings', path: '/bookings', icon: Calendar, group: 'Go to' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, group: 'Go to' },
  { label: 'Audit', path: '/audit', icon: ClipboardCheck, group: 'Go to' },
  { label: 'Reports', path: '/reports', icon: BarChart3, group: 'Go to' },
  { label: 'Settings', path: '/settings', icon: Settings, group: 'Go to' },
]

const assetItems = seedAssets.map((a) => ({
  label: `${a.tag} — ${a.name}`,
  sub: `${a.category} · ${a.department}`,
  path: '/assets',
  icon: Package,
  group: 'Assets',
  tag: a.tag,
}))

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const all = [...pages, ...assetItems]
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sub?.toLowerCase().includes(q) ||
        item.tag?.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    function handleKey(e) {
      if (!open) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[activeIndex]
        if (item) {
          navigate(item.path)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, results, activeIndex, navigate, onClose])

  if (!open) return null

  let lastGroup = null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm cmdk-fade"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-panel border border-line rounded-xl shadow-2xl overflow-hidden cmdk-pop">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
          <Search size={16} className="text-ink/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset, tag, serial, or page..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <kbd className="text-[10px] font-mono-tag text-ink/40 border border-line rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink/40">No matches for "{query}"</p>
          )}
          {results.map((item, i) => {
            const Icon = item.icon
            const showGroupLabel = item.group !== lastGroup
            lastGroup = item.group
            return (
              <div key={`${item.group}-${item.label}`}>
                {showGroupLabel && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-ink/35">
                    {item.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    navigate(item.path)
                    onClose()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i === activeIndex ? 'bg-status-available/10' : ''
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      i === activeIndex ? 'bg-status-available/20 text-status-available' : 'bg-surface text-ink/50'
                    }`}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${item.tag ? 'font-mono-tag' : ''} text-ink`}>
                      {item.label}
                    </span>
                    {item.sub && <span className="block text-xs text-ink/45 truncate">{item.sub}</span>}
                  </span>
                  {i === activeIndex && <CornerDownLeft size={13} className="text-ink/30 shrink-0" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
