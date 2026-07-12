import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/maintenance.json'

let mock = [...mockData]

// POST /maintenance { assetId, issue, priority, photoUrl? }
export function createMaintenanceRequest({ assetId, assetTag, issue, priority, photoUrl, raisedBy }) {
  return call(
    () => {
      const req = { id: mock.length + 401, assetId, assetTag, issue, priority, photoUrl: photoUrl || null, raisedBy, status: 'pending', technician: null }
      mock = [...mock, req]
      return mockDelay(req)
    },
    () => client.post('/maintenance', { assetId, issue, priority, photoUrl }).then((r) => r.data)
  )
}

// GET /maintenance?status=&assetId=
export function getMaintenanceRequests(params = {}) {
  return call(
    () => {
      let rows = mock
      if (params.status) rows = rows.filter((m) => m.status === params.status)
      if (params.assetId) rows = rows.filter((m) => m.assetId === params.assetId)
      return mockDelay(rows)
    },
    () => client.get('/maintenance', { params }).then((r) => r.data)
  )
}

// PATCH /maintenance/:id { action: "approve"|"reject"|"assign_technician"|"start"|"resolve", technician? }
// approve -> asset under_maintenance; resolve -> available (server-side asset status update)
export function actOnMaintenance(id, action, technician) {
  const nextStatus = { approve: 'approved', reject: 'rejected', assign_technician: 'technician_assigned', start: 'in_progress', resolve: 'resolved' }[action]
  return call(
    () => {
      mock = mock.map((m) => (m.id === id ? { ...m, status: nextStatus, technician: technician || m.technician } : m))
      return mockDelay(mock.find((m) => m.id === id))
    },
    () => client.patch(`/maintenance/${id}`, { action, technician }).then((r) => r.data)
  )
}
