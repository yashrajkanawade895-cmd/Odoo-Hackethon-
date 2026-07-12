import { useState, useEffect, useMemo, useRef } from 'react'
import { AlertTriangle, Calendar, Clock, Users, X, ChevronDown, ChevronUp, Zap, List, LayoutGrid } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { api } from '../api/index.js'

const purposeConfig = {
  internal: { color: 'bg-[#2B6E5E]', label: 'Internal' },
  client: { color: 'bg-[#3D5A8A]', label: 'Client' },
  training: { color: 'bg-[#8A6D3D]', label: 'Training' },
  interview: { color: 'bg-[#B8863B]', label: 'Interview' },
  town_hall: { color: 'bg-[#A13D3D]', label: 'Town Hall' },
}

export default function Meetings() {
  const qc = useQueryClient()
  const [view, setView] = useState('timeline') // 'timeline' or 'list'
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  
  // Form State
  const [resource, setResource] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('internal')
  const [bookedFor, setBookedFor] = useState('')
  const [attendees, setAttendees] = useState(1)
  const [error, setError] = useState('')

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.bookings.getResources(),
  })

  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.bookings.getMyBookings(),
  })

  const createBooking = useMutation({
    mutationFn: (v) => api.bookings.createBooking(v),
    onSuccess: () => {
      setError('')
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (err) => {
      if (err.status === 409 && err.body?.error === 'booking_overlap') {
        setError('That time slot overlaps an existing booking for this resource.')
      } else {
        setError(err.message || 'Could not create the booking. Please try again.')
      }
    },
  })

  const cancelBooking = useMutation({
    mutationFn: (id) => api.bookings.updateBooking(id, { action: 'cancel' }),
    onSuccess: () => {
      setSelectedBooking(null)
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })

  const book = (e) => {
    e.preventDefault()
    setError('')
    if (!resource || !date || !startTime || !endTime) return

    const newStart = new Date(`${date}T${startTime}`)
    const newEnd = new Date(`${date}T${endTime}`)
    if (newEnd <= newStart) {
      setError('End time must be after start time.')
      return
    }

    createBooking.mutate({
      assetId: Number(resource),
      startTs: newStart.toISOString(),
      endTs: newEnd.toISOString(),
      resourceName: resources.find(r => r.id === Number(resource))?.name || 'Resource',
      bookedBy: 'Admin User',
      purpose,
      bookedFor,
      attendees: Number(attendees)
    })
  }

  // Filter bookings to selected date for timeline and suggestions
  const dayBookings = useMemo(() => {
    return allBookings.filter(b => {
      const bDate = b.startTs.slice(0,10)
      return bDate === date && b.status !== 'cancelled'
    })
  }, [allBookings, date])

  // Smart suggestions logic
  const suggestions = useMemo(() => {
    const slots = []
    
    resources.forEach(r => {
      const rBookings = dayBookings.filter(b => b.resourceId === r.id)
      rBookings.sort((a,b) => new Date(a.startTs) - new Date(b.startTs))
      
      let currentTime = new Date(`${date}T08:00:00`)
      const endTimeLimit = new Date(`${date}T18:00:00`)
      
      rBookings.forEach(b => {
        const bStart = new Date(b.startTs)
        const bEnd = new Date(b.endTs)
        
        if (bStart > currentTime) {
          const diffMins = (bStart - currentTime) / (1000 * 60)
          if (diffMins >= 30) {
            slots.push({
              resourceId: r.id,
              resourceName: r.name,
              start: new Date(currentTime),
              end: bStart,
              label: `${currentTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${bStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
            })
          }
        }
        if (bEnd > currentTime) currentTime = bEnd
      })
      
      if (currentTime < endTimeLimit) {
        const diffMins = (endTimeLimit - currentTime) / (1000 * 60)
        if (diffMins >= 30) {
          slots.push({
            resourceId: r.id,
            resourceName: r.name,
            start: new Date(currentTime),
            end: endTimeLimit,
            label: `${currentTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${endTimeLimit.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
          })
        }
      }
    })
    
    return slots.slice(0, 4) // Show top 4
  }, [resources, dayBookings, date])

  // Helpers for timeline
  const getTimelineStyle = (startTs, endTs) => {
    const startHour = 8
    const totalHours = 10
    const start = new Date(startTs)
    const end = new Date(endTs)
    
    const sHour = start.getHours() + start.getMinutes()/60
    const eHour = end.getHours() + end.getMinutes()/60
    
    const left = Math.max(0, ((sHour - startHour) / totalHours) * 100)
    const width = Math.min(100 - left, ((eHour - sHour) / totalHours) * 100)
    
    return { left: `${left}%`, width: `${width}%` }
  }

  // Escape key for side panel
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedBooking(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      <PageHeader 
        title="Meetings & Resources" 
        subtitle="Manage room bookings, resources, and view schedules." 
        action={
          <div className="flex items-center gap-1 bg-surface border border-line rounded-md p-1">
            <button 
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors ${view === 'timeline' ? 'bg-panel shadow-sm text-ink' : 'text-ink/60 hover:text-ink'}`}
            >
              <Calendar size={14} /> Timeline
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-panel shadow-sm text-ink' : 'text-ink/60 hover:text-ink'}`}
            >
              <List size={14} /> List
            </button>
          </div>
        }
      />

      {/* Booking Form Panel */}
      <div className="mb-6">
        <button 
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center justify-between w-full bg-panel border border-line px-4 py-3 rounded-lg text-sm font-medium text-ink hover:border-accent/50 transition-colors"
        >
          <span className="flex items-center gap-2"><Calendar size={16} className="text-accent"/> Book a meeting room or resource</span>
          {formOpen ? <ChevronUp size={16} className="text-ink/50" /> : <ChevronDown size={16} className="text-ink/50" />}
        </button>
        
        {formOpen && (
          <form onSubmit={book} className="bg-panel border border-t-0 border-line rounded-b-lg p-5 -mt-2 pt-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">Resource</label>
                <select className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none" value={resource} onChange={(e) => setResource(e.target.value)} required>
                  <option value="">Select resource</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">Date</label>
                <input type="date" className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">Start Time</label>
                <input type="time" className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">End Time</label>
                <input type="time" className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">Purpose</label>
                <select className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="internal">Internal Sync</option>
                  <option value="client">Client Meeting</option>
                  <option value="training">Training</option>
                  <option value="interview">Interview</option>
                  <option value="town_hall">Town Hall</option>
                </select>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-ink/70">Booked For (Group / Project)</label>
                <input type="text" placeholder="e.g. Design Team" className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={bookedFor} onChange={(e) => setBookedFor(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/70">Attendees</label>
                <input type="number" min="1" className="w-full h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-accent focus:ring-1 outline-none" value={attendees} onChange={(e) => setAttendees(e.target.value)} required />
              </div>
            </div>
            
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-status-lost bg-status-lost/5 border border-status-lost/30 rounded-md px-3 py-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
            
            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={createBooking.isPending}>{createBooking.isPending ? 'Booking...' : 'Book slot'}</Button>
            </div>
          </form>
        )}
      </div>

      {view === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-panel border border-line rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-surface/50">
              <p className="text-sm font-medium text-ink">Schedule for {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <input type="date" className="h-8 rounded-md border border-line bg-panel px-2 text-xs" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Timeline Header */}
                <div className="flex border-b border-line bg-surface text-[11px] font-mono-tag text-ink/50">
                  <div className="w-48 shrink-0 px-4 py-2 border-r border-line">Resource</div>
                  <div className="flex-1 grid grid-cols-10 relative">
                    {Array.from({length: 10}).map((_, i) => (
                      <div key={i} className="border-r border-line/50 px-2 py-2">{8 + i}:00</div>
                    ))}
                  </div>
                </div>
                
                {/* Timeline Rows */}
                {resources.map(r => {
                  const rBookings = dayBookings.filter(b => b.resourceId === r.id)
                  return (
                    <div key={r.id} className="flex border-b border-line last:border-0 group">
                      <div className="w-48 shrink-0 px-4 py-4 border-r border-line text-sm font-medium text-ink bg-panel flex items-center">
                        {r.name}
                      </div>
                      <div className="flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMTAlIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMTAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wMikiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]">
                        {/* Bookings */}
                        {rBookings.map(b => {
                          const style = getTimelineStyle(b.startTs, b.endTs)
                          const cfg = purposeConfig[b.purpose] || { color: 'bg-line', label: 'Meeting' }
                          return (
                            <button
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              className={`absolute top-2 bottom-2 rounded-md ${cfg.color} opacity-90 hover:opacity-100 hover:shadow-md transition-all text-left px-2 overflow-hidden flex items-center lift-on-hover`}
                              style={style}
                            >
                              <span className="text-[10px] font-medium text-white truncate whitespace-nowrap">{cfg.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Smart Availability */}
          {suggestions.length > 0 && (
            <div className="bg-surface/50 border border-line rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 text-ink/70">
                <Zap size={16} className="text-accent" />
                <h3 className="text-sm font-medium">Smart Suggestions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setResource(String(s.resourceId))
                      setStartTime(s.start.toTimeString().slice(0,5))
                      setEndTime(s.end.toTimeString().slice(0,5))
                      setFormOpen(true)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="flex items-center gap-2 bg-status-available/10 border border-status-available/20 text-status-available text-xs px-3 py-1.5 rounded-full hover:bg-status-available/20 transition-colors"
                  >
                    <span className="font-medium">{s.resourceName}</span>
                    <span className="w-1 h-1 rounded-full bg-status-available/40" />
                    <span className="font-mono-tag">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-panel border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-ink/60 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Resource</th>
                <th className="text-left px-4 py-2 font-medium">Purpose</th>
                <th className="text-left px-4 py-2 font-medium">Booked For</th>
                <th className="text-left px-4 py-2 font-medium">Time</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">Loading bookings...</td>
                </tr>
              )}
              {!isLoading && allBookings.length === 0 && (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-4 py-6 text-center text-ink/50">No bookings found.</td>
                </tr>
              )}
              {!isLoading && allBookings.map((b) => {
                const cfg = purposeConfig[b.purpose] || { color: 'bg-line', label: 'Meeting' }
                return (
                  <tr key={b.id} className="border-t border-line hover:bg-surface/50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                    <td className="px-4 py-3 text-ink font-medium">{b.asset?.name || b.resource}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full text-white ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-ink/70 text-xs">
                      {b.bookedFor} <span className="text-ink/40 ml-1">({b.attendees} pax)</span>
                    </td>
                    <td className="px-4 py-3 text-ink/60 text-xs">
                      {new Date(b.startTs).toLocaleDateString([], {month:'short', day:'numeric'})}, {new Date(b.startTs).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(b.endTs).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        b.status === 'cancelled' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(b.status === 'upcoming' || b.status === 'ongoing') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelBooking.mutate(b.id) }}
                          disabled={cancelBooking.isPending}
                          className="text-xs text-status-lost hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side Panel (Booking Details) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-[400px] max-w-full bg-panel h-full shadow-2xl flex flex-col translate-x-0 transition-transform duration-200 border-l border-line">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface/50">
              <h2 className="text-base font-semibold text-ink">Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-md hover:bg-line/50 text-ink/50 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <p className="text-sm text-ink/50 mb-1">Resource</p>
                <p className="text-xl font-medium text-ink">{selectedBooking.asset?.name || selectedBooking.resource}</p>
                <div className="mt-3 inline-block">
                  <span className={`text-xs px-2.5 py-1 rounded-full text-white ${purposeConfig[selectedBooking.purpose]?.color || 'bg-line'}`}>
                    {purposeConfig[selectedBooking.purpose]?.label || 'Meeting'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink/50 mb-1">Date</p>
                  <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent"/> {new Date(selectedBooking.startTs).toLocaleDateString([], {weekday: 'short', month:'short', day:'numeric'})}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink/50 mb-1">Time</p>
                  <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                    <Clock size={14} className="text-accent"/> {new Date(selectedBooking.startTs).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(selectedBooking.endTs).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-line pt-4 space-y-4">
                <div>
                  <p className="text-xs text-ink/50 mb-1">Booked By</p>
                  <p className="text-sm text-ink">{selectedBooking.bookedBy}</p>
                </div>
                
                {selectedBooking.bookedFor && (
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Booked For</p>
                    <p className="text-sm text-ink">{selectedBooking.bookedFor}</p>
                  </div>
                )}
                
                {selectedBooking.attendees && (
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Attendees</p>
                    <p className="text-sm text-ink flex items-center gap-1.5">
                      <Users size={14} className="text-ink/60" /> {selectedBooking.attendees} people
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-line pt-4">
                <p className="text-xs text-ink/50 mb-2">Status</p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  selectedBooking.status === 'cancelled' ? 'bg-status-retired/10 text-status-retired' : 
                  selectedBooking.status === 'completed' ? 'bg-line/50 text-ink/70' :
                  'bg-status-allocated/10 text-status-allocated'
                }`}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>
            </div>
            
            {(selectedBooking.status === 'upcoming' || selectedBooking.status === 'ongoing') && (
              <div className="p-4 border-t border-line bg-surface/50 grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => {
                  const reason = window.prompt("Reason for rescheduling:")
                  if (reason) {
                    api.bookings.requestReschedule(selectedBooking.id, reason).then(() => {
                      alert("Reschedule request sent!")
                      setSelectedBooking(null)
                    })
                  }
                }}>
                  Reschedule
                </Button>
                <Button variant="default" className="bg-status-lost hover:bg-status-lost/90 text-white" onClick={() => cancelBooking.mutate(selectedBooking.id)} disabled={cancelBooking.isPending}>
                  {cancelBooking.isPending ? 'Canceling...' : 'Cancel Booking'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
