import { client, call, mockDelay } from './client.js'

// Reports are read-heavy and backend-computed; mocks return small illustrative
// shapes just so chart components have something to render pre-Phase-5.
export function getUtilization() {
  return call(
    () => mockDelay([{ label: 'MacBook Pro 16"', value: 82 }, { label: 'Conference Room A', value: 65 }, { label: 'Forklift', value: 12 }]),
    () => client.get('/reports/utilization').then((r) => r.data)
  )
}

export function getMaintenanceFrequency() {
  return call(
    () => mockDelay([{ label: 'Vehicles', value: 6 }, { label: 'Electronics', value: 4 }, { label: 'Furniture', value: 1 }]),
    () => client.get('/reports/maintenance-frequency').then((r) => r.data)
  )
}

export function getDepartmentAllocation() {
  return call(
    () => mockDelay([{ label: 'Engineering', value: 18 }, { label: 'Design', value: 9 }, { label: 'Facilities', value: 5 }]),
    () => client.get('/reports/department-allocation').then((r) => r.data)
  )
}

export function getBookingHeatmap() {
  return call(
    () => mockDelay([]),
    () => client.get('/reports/booking-heatmap').then((r) => r.data)
  )
}

// GET /reports/export?report=...&type=csv
export function exportReport(report, type = 'csv') {
  return call(
    () => mockDelay({ url: '#', note: 'export not wired in mocks' }),
    () => client.get('/reports/export', { params: { report, type } }).then((r) => r.data)
  )
}
