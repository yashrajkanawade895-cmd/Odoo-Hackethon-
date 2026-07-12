import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/departments.json'

let mock = [...mockData]

export function getDepartments() {
  return call(() => mockDelay(mock), () => client.get('/departments').then((r) => r.data))
}

export function createDepartment({ name, headId, parentId }) {
  return call(
    () => {
      const dept = { id: mock.length + 1, name, headId: headId ?? null, headName: null, parentId: parentId ?? null, memberCount: 0, status: 'active' }
      mock = [...mock, dept]
      return mockDelay(dept)
    },
    () => client.post('/departments', { name, headId, parentId }).then((r) => r.data)
  )
}

export function updateDepartment(id, patch) {
  return call(
    () => {
      mock = mock.map((d) => (d.id === id ? { ...d, ...patch } : d))
      return mockDelay(mock.find((d) => d.id === id))
    },
    () => client.patch(`/departments/${id}`, patch).then((r) => r.data)
  )
}
