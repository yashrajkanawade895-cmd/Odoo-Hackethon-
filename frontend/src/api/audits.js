import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/auditCycles.json'

let mock = [...mockData]

// POST /audit-cycles { name, scopeDepartmentId?, scopeLocation?, startDate, endDate }
export function createAuditCycle(fields) {
  return call(
    () => {
      const cycle = { id: mock.length + 501, status: 'open', auditorIds: [], auditors: [], items: [], ...fields }
      mock = [...mock, cycle]
      return mockDelay(cycle)
    },
    () => client.post('/audit-cycles', fields).then((r) => r.data)
  )
}

// POST /audit-cycles/:id/auditors { auditorIds: [..] }
export function assignAuditors(cycleId, auditorIds) {
  return call(
    () => {
      mock = mock.map((c) => (c.id === cycleId ? { ...c, auditorIds } : c))
      return mockDelay(mock.find((c) => c.id === cycleId))
    },
    () => client.post(`/audit-cycles/${cycleId}/auditors`, { auditorIds }).then((r) => r.data)
  )
}

// GET /audit-cycles/:id — incl. items + progress
export function getAuditCycle(id) {
  return call(() => mockDelay(mock.find((c) => c.id === id)), () => client.get(`/audit-cycles/${id}`).then((r) => r.data))
}

export function getAuditCycles() {
  return call(() => mockDelay(mock), () => client.get('/audit-cycles').then((r) => r.data))
}

// PATCH /audit-items/:id { result: "verified"|"missing"|"damaged", notes? }
export function updateAuditItem(itemId, result, notes) {
  return call(
    () => {
      mock = mock.map((c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, result, notes } : i)) }))
      return mockDelay({ id: itemId, result, notes })
    },
    () => client.patch(`/audit-items/${itemId}`, { result, notes }).then((r) => r.data)
  )
}

// GET /audit-cycles/:id/discrepancies
export function getDiscrepancies(cycleId) {
  return call(
    () => mockDelay((mock.find((c) => c.id === cycleId)?.items || []).filter((i) => i.result === 'missing' || i.result === 'damaged')),
    () => client.get(`/audit-cycles/${cycleId}/discrepancies`).then((r) => r.data)
  )
}

// PATCH /audit-cycles/:id/close — locks cycle; confirmed missing -> asset lost
export function closeAuditCycle(id) {
  return call(
    () => {
      mock = mock.map((c) => (c.id === id ? { ...c, status: 'closed' } : c))
      return mockDelay(mock.find((c) => c.id === id))
    },
    () => client.patch(`/audit-cycles/${id}/close`).then((r) => r.data)
  )
}
