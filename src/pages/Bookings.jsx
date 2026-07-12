import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { Button } from '../components/ui/button.jsx'
import { api } from '../api/client.js'

export default function Bookings() {
  const queryClient = useQueryClient()
  const [resourceId, setResourceId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [error, setError] = useState('')

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: api.bookings.resources
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: api.bookings.myBookings
  })

  const bookMutation = useMutation({
    mutationFn: api.bookings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setError('')
    },
    onError: (err) => {
      setError(err.message || 'Failed to create booking')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.bookings.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const book = (e) => {
    e.preventDefault()
    setError('')
    if (!resourceId || !date || !startTime || !endTime) return

    const newStart = new Date(`${date}T${startTime}`)
    const newEnd = new Date(`${date}T${endTime}`)
    if (newEnd <= newStart) {
      setError('End time must be after start time.')
      return
    }

    bookMutation.mutate({
      resourceId: parseInt(resourceId, 10),
      startTs: newStart.toISOString(),
      endTs: newEnd.toISOString()
    })
  }

  return (
    <>
      <PageHeader title="Resource booking" subtitle="Time-slot booking of shared resources with no overlaps." />

      <form onSubmit={book} className="bg-panel border border-line rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-ink mb-3">Book a resource</p>
        <div className="grid grid-cols-4 gap-3">
          <select 
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm" 
            value={resourceId} 
            onChange={(e) => setResourceId(e.target.value)}
            disabled={bookMutation.isPending}
          >
            <option value="">Select resource</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="date" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} disabled={bookMutation.isPending} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={bookMutation.isPending} />
          <input type="time" className="h-9 rounded-md border border-line bg-surface px-3 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={bookMutation.isPending} />
        </div>
        <div className="mt-3">
          <Button type="submit" disabled={bookMutation.isPending}>
            {bookMutation.isPending ? 'Booking...' : 'Book slot'}
          </Button>
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
              <th className="text-left px-4 py-2 font-medium">Start</th>
              <th className="text-left px-4 py-2 font-medium">End</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bookingsLoading && <tr><td colSpan="5" className="p-4 text-center text-ink/60 text-sm">Loading bookings...</td></tr>}
            {!bookingsLoading && bookings.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink">{b.resource?.name || `Asset #${b.resourceId}`}</td>
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
                  {b.status !== 'cancelled' && new Date(b.endTs) > new Date() && (
                    <button 
                      onClick={() => cancelMutation.mutate(b.id)} 
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!bookingsLoading && bookings.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/40 text-sm">You have no bookings.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
