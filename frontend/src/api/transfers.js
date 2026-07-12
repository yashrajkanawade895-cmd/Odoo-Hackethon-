import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/transfers.json'

let mock = [...mockData]

// POST /transfers { assetId, toUserId }
export function createTransfer({ assetId, toUserId, assetTag, fromName, toName }) {
  return call(
    () => {
      const transfer = { id: mock.length + 1, assetId, assetTag, toUserId, from: fromName, to: toName, status: 'requested' }
      mock = [...mock, transfer]
      return mockDelay(transfer)
    },
    () => client.post('/transfers', { assetId, toUserId }).then((r) => r.data)
  )
}

// GET /transfers?status=requested
export function getTransfers(params = {}) {
  return call(
    () => mockDelay(params.status ? mock.filter((t) => t.status === params.status) : mock),
    () => client.get('/transfers', { params }).then((r) => r.data)
  )
}

// PATCH /transfers/:id { action: "approve" | "reject" }
// approve -> old allocation closed, new one opened, history updated (server-side)
export function actOnTransfer(id, action) {
  return call(
    () => {
      mock = mock.map((t) => (t.id === id ? { ...t, status: action === 'approve' ? 'approved' : 'rejected' } : t))
      return mockDelay(mock.find((t) => t.id === id))
    },
    () => client.patch(`/transfers/${id}`, { action }).then((r) => r.data)
  )
}
