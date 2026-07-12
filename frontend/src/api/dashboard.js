import { client, call, mockDelay } from './client.js'
import mock from '../mocks/dashboard.json'

// GET /dashboard/kpis
export function kpis() {
  return call(
    () => mockDelay(mock),
    () => client.get('/dashboard/kpis').then((r) => r.data)
  )
}
