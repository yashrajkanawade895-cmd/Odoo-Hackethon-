import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/employees.json'

let mock = [...mockData]

// GET /employees?department=&role=&status=&q=
export function getEmployees(params = {}) {
  return call(
    () => {
      let rows = mock
      if (params.department) rows = rows.filter((e) => e.department === params.department)
      if (params.role) rows = rows.filter((e) => e.role === params.role)
      if (params.status) rows = rows.filter((e) => e.status === params.status)
      if (params.q) rows = rows.filter((e) => e.name.toLowerCase().includes(params.q.toLowerCase()))
      return mockDelay(rows)
    },
    () => client.get('/employees', { params }).then((r) => r.data)
  )
}

// PATCH /employees/:id/role — the only endpoint in the app that changes roles.
export function updateEmployeeRole(id, role) {
  return call(
    () => {
      mock = mock.map((e) => (e.id === id ? { ...e, role } : e))
      return mockDelay(mock.find((e) => e.id === id))
    },
    () => client.patch(`/employees/${id}/role`, { role }).then((r) => r.data)
  )
}

export function updateEmployee(id, patch) {
  return call(
    () => {
      mock = mock.map((e) => (e.id === id ? { ...e, ...patch } : e))
      return mockDelay(mock.find((e) => e.id === id))
    },
    () => client.patch(`/employees/${id}`, patch).then((r) => r.data)
  )
}
