import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/notifications.json'

let mock = [...mockData]

export function getNotifications() {
  return call(() => mockDelay(mock), () => client.get('/notifications').then((r) => r.data))
}

export function markNotificationRead(id) {
  return call(
    () => {
      mock = mock.map((n) => (n.id === id ? { ...n, read: true } : n))
      return mockDelay(mock.find((n) => n.id === id))
    },
    () => client.patch(`/notifications/${id}/read`).then((r) => r.data)
  )
}
