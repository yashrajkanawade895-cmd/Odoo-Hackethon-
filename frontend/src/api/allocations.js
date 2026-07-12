import { client, call, mockDelay, mockConflict } from './client.js'
import mockAllocations from '../mocks/allocations.json'
import mockAssets from '../mocks/assets.json'

let mock = [...mockAllocations]

function activeHolder(assetId) {
  return mock.find((a) => a.assetId === assetId && a.status !== 'returned')
}

// POST /allocations { assetId, holderUserId | holderDepartmentId, expectedReturnDate? }
// -> 409 asset_already_allocated + held_by + suggest:"transfer"
export function createAllocation({ assetId, holderUserId, holderDepartmentId, holderName, expectedReturnDate }) {
  return call(
    () => {
      const existing = activeHolder(assetId)
      if (existing) {
        return mockConflict({ error: 'asset_already_allocated', held_by: existing.holder, suggest: 'transfer' })
      }
      const asset = mockAssets.find((a) => a.id === assetId)
      const allocation = {
        id: mock.length + 201,
        assetId,
        assetTag: asset?.tag,
        assetName: asset?.name,
        holderUserId,
        holderDepartmentId,
        holder: holderName,
        allocatedOn: new Date().toISOString().slice(0, 10),
        expectedReturnDate: expectedReturnDate || null,
        status: 'active',
      }
      mock = [...mock, allocation]
      return mockDelay(allocation)
    },
    () => client.post('/allocations', { assetId, holderUserId, holderDepartmentId, expectedReturnDate }).then((r) => r.data)
  )
}

// PATCH /allocations/:id/return { checkinNotes? } -> asset back to available
export function returnAllocation(id, checkinNotes) {
  return call(
    () => {
      mock = mock.map((a) => (a.id === id ? { ...a, status: 'returned', checkinNotes } : a))
      return mockDelay(mock.find((a) => a.id === id))
    },
    () => client.patch(`/allocations/${id}/return`, { checkinNotes }).then((r) => r.data)
  )
}

// GET /allocations?assetId=&holder=&overdue=true
export function getAllocations(params = {}) {
  return call(
    () => {
      let rows = mock
      if (params.assetId) rows = rows.filter((a) => a.assetId === params.assetId)
      if (params.holder) rows = rows.filter((a) => a.holder === params.holder)
      if (params.overdue) rows = rows.filter((a) => a.status === 'overdue')
      return mockDelay(rows)
    },
    () => client.get('/allocations', { params }).then((r) => r.data)
  )
}
