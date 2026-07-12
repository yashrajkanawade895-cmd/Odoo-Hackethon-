import { X, MapPin, Building2, Calendar, Wallet, Wrench, ArrowLeftRight } from 'lucide-react'
import StatusPill from './StatusPill.jsx'
import { seedAllocations, seedMaintenanceRequests } from '../data/seedData.js'

function QrPlaceholder({ value }) {
  // Deterministic pseudo-QR pattern from the tag — a visual stand-in until a real QR lib is wired up.
  let seed = 0
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 997
  const cells = Array.from({ length: 49 }, (_, i) => {
    seed = (seed * 1103515245 + 12345) % 233280
    return seed % 5 === 0
  })
  return (
    <div className="w-24 h-24 bg-white border border-line rounded-md p-1.5 grid grid-cols-7 gap-[1px] shrink-0">
      {cells.map((on, i) => (
        <div key={i} className={on ? 'bg-ink' : 'bg-white'} />
      ))}
    </div>
  )
}

export default function AssetDetailDrawer({ asset, onClose }) {
  if (!asset) return null

  const allocationHistory = seedAllocations.filter((a) => a.assetTag === asset.tag)
  const maintenanceHistory = seedMaintenanceRequests.filter((m) => m.assetTag === asset.tag)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm cmdk-fade" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-panel shadow-2xl overflow-y-auto cmdk-pop-side">
        <div className="sticky top-0 bg-panel border-b border-line px-5 py-4 flex items-center justify-between z-10">
          <p className="text-sm font-medium text-ink">Asset passport</p>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface transition-colors" aria-label="Close">
            <X size={16} className="text-ink/60" />
          </button>
        </div>

        <div className="p-5">
          {/* Passport header */}
          <div className="bg-ink text-white rounded-xl p-5 flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-xs text-white/50 mb-1">{asset.category}</p>
              <h2 className="text-lg font-semibold truncate mb-1">{asset.name}</h2>
              <p className="font-mono-tag text-status-available text-sm tracking-wide">{asset.tag}</p>
              <div className="mt-3">
                <StatusPill status={asset.status === 'under_maintenance' ? 'maintenance' : asset.status} />
              </div>
            </div>
            <QrPlaceholder value={asset.tag} />
          </div>

          {/* Core details */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-line rounded-lg px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Serial number</p>
              <p className="text-sm font-mono-tag text-ink">{asset.serial}</p>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Condition</p>
              <p className="text-sm text-ink">{asset.condition || '—'}</p>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <Building2 size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Department</p>
                <p className="text-sm text-ink">{asset.department}</p>
              </div>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <MapPin size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Location</p>
                <p className="text-sm text-ink">{asset.location}</p>
              </div>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <Calendar size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Acquired</p>
                <p className="text-sm font-mono-tag text-ink">{asset.acquisitionDate || '—'}</p>
              </div>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <Wallet size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Acquisition cost</p>
                <p className="text-sm font-mono-tag text-ink">
                  {asset.acquisitionCost ? `₹${asset.acquisitionCost.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Allocation history */}
          <div className="mb-6">
            <p className="text-xs font-medium text-ink/70 mb-2 flex items-center gap-1.5">
              <ArrowLeftRight size={13} /> Allocation history
            </p>
            {allocationHistory.length === 0 ? (
              <p className="text-xs text-ink/40 border border-dashed border-line rounded-md px-3 py-3 text-center">
                No allocation history yet.
              </p>
            ) : (
              <div className="space-y-2">
                {allocationHistory.map((a) => (
                  <div key={a.id} className="border border-line rounded-md px-3 py-2 text-xs flex items-center justify-between">
                    <span className="text-ink">{a.holder}</span>
                    <span className="text-ink/50 font-mono-tag">{a.allocatedOn} → {a.expectedReturn}</span>
                    <span className={`px-2 py-0.5 rounded-full ${a.status === 'overdue' ? 'bg-status-lost/10 text-status-lost' : a.status === 'returned' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance history */}
          <div>
            <p className="text-xs font-medium text-ink/70 mb-2 flex items-center gap-1.5">
              <Wrench size={13} /> Maintenance history
            </p>
            {maintenanceHistory.length === 0 ? (
              <p className="text-xs text-ink/40 border border-dashed border-line rounded-md px-3 py-3 text-center">
                No maintenance requests yet.
              </p>
            ) : (
              <div className="space-y-2">
                {maintenanceHistory.map((m) => (
                  <div key={m.id} className="border border-line rounded-md px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-ink">{m.issue}</span>
                      <span className="text-ink/40 capitalize">{m.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-ink/45">Raised by {m.raisedBy}{m.technician ? ` · ${m.technician}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
