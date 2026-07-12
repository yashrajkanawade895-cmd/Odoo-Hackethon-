import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { api } from '../api/index.js'

export default function Bookings() {
  const qc = useQueryClient()
  const [resource, setResource] = useState('')
  const [date, setDate] = useState('2026-07-14')
  const [startTime, setStartTime] = useState('09:30')
  const [endTime, setEndTime] = useState('10:30')
  const [error, setError] = useState('')

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.bookings.getResources(),
  })

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.bookings.getMyBookings(),
  })

  const createBooking = useMutation({
    mutationFn: (v) => api.bookings.createBooking(v),
    onSuccess: () => {
      setError('')
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      qc.invalidateQueries({ queryKey: ['resource-bookings'] })
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
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      qc.invalidateQueries({ queryKey: ['resource-bookings'] })
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
    })
  }

  return (
    <>
      <PageHeader title="Resource booking" subtitle="Time-slot booking of shared resources with no overlaps." />

      <form onSubmit={book} className="bg-panel border border-line rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-ink mb-3">Book a resource</p>
        <div className="grid grid-cols-4 gap-3">
          <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={resource} onChange={(e) => setResource(e.target.value)}>
            <option value="">Select resource</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="date" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button type="submit" disabled={createBooking.isPending}>{createBooking.isPending ? 'Booking…' : 'Book slot'}</Button>
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
            {isLoading && (
              <tr className="border-t border-line">
                <td colSpan={6} className="px-4 py-6 text-center text-ink/50">Loading bookings…</td>
              </tr>
            )}
            {!isLoading && bookings.length === 0 && (
              <tr className="border-t border-line">
                <td colSpan={6} className="px-4 py-6 text-center text-ink/50">No bookings yet. Book a resource above to get started.</td>
              </tr>
            )}
            {!isLoading && bookings.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink">{b.asset?.name}</td>
                <td className="px-4 py-2.5 text-ink/70">You</td>
                <td className="px-4 py-2.5 font-mono-tag text-ink/60">{new Date(b.startTs).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="px-4 py-2.5 font-mono-tag text-ink/60">{new Date(b.endTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'cancelled' ? 'bg-status-retired/10 text-status-retired' : 'bg-status-allocated/10 text-status-allocated'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {(b.status === 'upcoming' || b.status === 'ongoing') && (
                    <button
                      onClick={() => cancelBooking.mutate(b.id)}
                      disabled={cancelBooking.isPending}
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
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
