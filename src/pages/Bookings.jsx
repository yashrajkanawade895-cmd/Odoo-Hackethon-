import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { seedBookings, seedResources } from '../data/seedData.js'

function overlaps(existingStart, existingEnd, newStart, newEnd) {
  // new.start < existing.end AND new.end > existing.start -> reject. Back-to-back allowed.
  return newStart < existingEnd && newEnd > existingStart
}

export default function Bookings() {
  const [bookings, setBookings] = useState(seedBookings)
  const [resource, setResource] = useState('')
  const [date, setDate] = useState('2026-07-14')
  const [startTime, setStartTime] = useState('09:30')
  const [endTime, setEndTime] = useState('10:30')
  const [error, setError] = useState('')

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

    const conflict = bookings.find((b) => {
      if (b.resource !== resource || b.status === 'cancelled') return false
      return overlaps(new Date(b.start), new Date(b.end), newStart, newEnd)
    })

    if (conflict) {
      setError(
        `${resource} is already booked ${new Date(conflict.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${new Date(
          conflict.end
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. This overlaps — choose a different slot.`
      )
      return
    }

    setBookings((prev) => [
      ...prev,
      { id: `b${prev.length + 1}`, resource, bookedBy: 'You', start: `${date}T${startTime}`, end: `${date}T${endTime}`, status: 'upcoming' },
    ])
  }

  const cancel = (id) => setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))

  return (
    <>
      <PageHeader title="Resource booking" subtitle="Time-slot booking of shared resources with no overlaps." />

      <form onSubmit={book} className="bg-panel border border-line rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-ink mb-3">Book a resource</p>
        <div className="grid grid-cols-4 gap-3">
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={resource} onChange={(e) => setResource(e.target.value)}>
            <option value="">Select resource</option>
            {seedResources.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <input type="date" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button type="submit">Book slot</Button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-status-lost bg-status-lost/5 border border-status-lost/30 rounded-md px-3 py-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
      </form>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink/60 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Resource</th>
              <th className="text-left px-4 py-2 font-medium">Booked by</th>
              <th className="text-left px-4 py-2 font-medium">Start</th>
              <th className="text-left px-4 py-2 font-medium">End</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink">{b.resource}</td>
                <td className="px-4 py-2.5 text-ink/70">{b.bookedBy}</td>
                <td className="px-4 py-2.5 font-mono-tag text-ink/60">{new Date(b.start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="px-4 py-2.5 font-mono-tag text-ink/60">{new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'cancelled' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {b.status === 'upcoming' && (
                    <button onClick={() => cancel(b.id)} className="text-xs text-accent hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
