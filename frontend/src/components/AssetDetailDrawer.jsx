import { X, MapPin, Building2, Calendar, Wallet, Wrench, ArrowLeftRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import StatusPill from './StatusPill.jsx'
import { api } from '../api/index.js'

function AssetQr({ value }) {
  // Real scannable QR of the asset tag — scanning shows the tag to look up.
  return (
    <div className="bg-white border border-line rounded-md p-1.5 shrink-0 flex flex-col items-center gap-1">
      <QRCodeSVG value={value} size={84} />
      <span className="text-[9px] text-ink/50">Scan to look up</span>
    </div>
  )
}

export default function AssetDetailDrawer({ asset, onClose }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['asset-history', asset?.id],
    queryFn: () => api.assets.getAssetHistory(asset.id),
    enabled: !!asset,
  })

  if (!asset) return null

  const entries = history || []
  const allocationHistory = entries.filter((h) => h.type === 'allocation')
  const maintenanceHistory = entries.filter((h) => h.type === 'maintenance')

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
              <p className="text-xs text-white/50 mb-1">{asset.category?.name || '—'}</p>
              <h2 className="text-lg font-semibold truncate mb-1">{asset.name}</h2>
              <p className="font-mono-tag text-status-available text-sm tracking-wide">{asset.tag}</p>
              <div className="mt-3">
                <StatusPill status={asset.status === 'under_maintenance' ? 'maintenance' : asset.status} />
              </div>
            </div>
            <AssetQr value={asset.tag} />
          </div>

          {/* Core details */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-line rounded-lg px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Serial number</p>
              <p className="text-sm font-mono-tag text-ink">{asset.serialNumber || '—'}</p>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Condition</p>
              <p className="text-sm text-ink capitalize">{asset.condition || '—'}</p>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <Building2 size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Department</p>
                <p className="text-sm text-ink">—</p>
              </div>
            </div>
            <div className="border border-line rounded-lg px-3 py-2.5 flex items-start gap-2">
              <MapPin size={14} className="text-ink/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40 mb-1">Location</p>
                <p className="text-sm text-ink">{asset.location || '—'}</p>
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
                  {asset.acquisitionCost ? `₹${Number(asset.acquisitionCost).toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Allocation history */}
          <div className="mb-6">
            <p className="text-xs font-medium text-ink/70 mb-2 flex items-center gap-1.5">
              <ArrowLeftRight size={13} /> Allocation history
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-9 bg-surface rounded-md animate-pulse" />
                ))}
              </div>
            ) : allocationHistory.length === 0 ? (
              <p className="text-xs text-ink/40 border border-dashed border-line rounded-md px-3 py-3 text-center">
                No allocation history yet.
              </p>
            ) : (
              <div className="space-y-2">
                {allocationHistory.map((a, i) => (
                  <div key={i} className="border border-line rounded-md px-3 py-2 text-xs flex items-center justify-between gap-2">
                    <span className="text-ink">{a.holderUser?.name || '—'}</span>
                    <span className="text-ink/50 font-mono-tag">
                      {a.allocatedAt || '—'} → {a.returnedAt || 'present'}
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
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-9 bg-surface rounded-md animate-pulse" />
                ))}
              </div>
            ) : maintenanceHistory.length === 0 ? (
              <p className="text-xs text-ink/40 border border-dashed border-line rounded-md px-3 py-3 text-center">
                No maintenance requests yet.
              </p>
            ) : (
              <div className="space-y-2">
                {maintenanceHistory.map((m, i) => (
                  <div key={i} className="border border-line rounded-md px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-ink">{m.issue}</span>
                      <span className="text-ink/40 capitalize">{(m.status || '').replace('_', ' ')}</span>
                    </div>
                    <p className="text-ink/45 font-mono-tag">{m.createdAt || '—'}</p>
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
