import { client, call, mockDelay, mockConflict } from './client.js'
import mockResources from '../mocks/resources.json'
import mockBookings from '../mocks/bookings.json'

let mock = [...mockBookings]

// new.start < existing.end AND new.end > existing.start -> reject. Back-to-back allowed.
function overlaps(existingStart, existingEnd, newStart, newEnd) {
  return newStart < existingEnd && newEnd > existingStart
}

// GET /resources — assets where is_bookable=true
export function getResources() {
  return call(() => mockDelay(mockResources), () => client.get('/resources').then((r) => r.data))
}

// GET /resources/:id/bookings?from=&to=
export function getResourceBookings(resourceId, params = {}) {
  return call(
    () => mockDelay(mock.filter((b) => b.resourceId === resourceId)),
    () => client.get(`/resources/${resourceId}/bookings`, { params }).then((r) => r.data)
  )
}

// POST /bookings { assetId, startTs, endTs, purpose, bookedFor, attendees } -> 409 booking_overlap
export function createBooking({ assetId, startTs, endTs, resourceName, bookedBy, purpose, bookedFor, attendees }) {
  return call(
    () => {
      const newStart = new Date(startTs)
      const newEnd = new Date(endTs)
      const conflict = mock.find(
        (b) => b.resourceId === assetId && b.status !== 'cancelled' && overlaps(new Date(b.startTs), new Date(b.endTs), newStart, newEnd)
      )
      if (conflict) return mockConflict({ error: 'booking_overlap' })
      const booking = { id: mock.length + 301, resourceId: assetId, resource: resourceName, bookedBy, startTs, endTs, status: 'upcoming', purpose, bookedFor, attendees }
      mock = [...mock, booking]
      return mockDelay(booking)
    },
    () => client.post('/bookings', { assetId, startTs, endTs, purpose, bookedFor, attendees }).then((r) => r.data)
  )
}

// GET /my-bookings
export function getMyBookings() {
  return call(() => mockDelay(mock), () => client.get('/my-bookings').then((r) => r.data))
}

export function updateBooking(id, patch) {
  return call(
    () => {
      mock = mock.map((b) => (b.id === id ? { ...b, ...(patch.action === 'cancel' ? { status: 'cancelled' } : patch) } : b))
      return mockDelay(mock.find((b) => b.id === id))
    },
    () => client.patch(`/bookings/${id}`, patch).then((r) => r.data)
  )
}

export function requestReschedule(id, reason) {
  return call(
    () => mockDelay({ success: true, message: "Reschedule request sent" }),
    () => client.post(`/bookings/${id}/request-reschedule`, { reason }).then((r) => r.data)
  )
}
