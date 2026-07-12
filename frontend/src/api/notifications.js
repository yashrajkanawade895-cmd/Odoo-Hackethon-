import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/notifications.json'

let mock = mockData.notifications.map((n) => ({ ...n }))

// Mirrors the real backend envelope: { unreadCount, notifications: [...] } with isRead.
function envelope() {
  return { unreadCount: mock.filter((n) => !n.isRead).length, notifications: mock }
}

export function getNotifications() {
  return call(() => mockDelay(envelope()), () => client.get('/notifications').then((r) => r.data))
}

export function markNotificationRead(id) {
  return call(
    () => {
      mock = mock.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      return mockDelay(mock.find((n) => n.id === id))
    },
    () => client.patch(`/notifications/${id}/read`).then((r) => r.data)
  )
}
