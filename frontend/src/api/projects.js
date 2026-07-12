import { client, call, mockDelay } from './client.js'
import mockProjects from '../mocks/projects.json'

let mock = [...mockProjects]

export function getProjects(params = {}) {
  return call(
    () => {
      let rows = mock
      if (params.department) rows = rows.filter((p) => p.departmentId === params.department)
      return mockDelay(rows)
    },
    () => client.get('/projects', { params }).then((r) => r.data)
  )
}

export function createProject(project) {
  return call(
    () => {
      const newProj = { id: mock.length + 1, ...project, members: [], status: 'active', department: { name: 'Unknown' } }
      mock = [...mock, newProj]
      return mockDelay(newProj)
    },
    () => client.post('/projects', project).then((r) => r.data)
  )
}

export function updateProject(id, patch) {
  return call(
    () => {
      mock = mock.map((p) => (p.id === id ? { ...p, ...patch } : p))
      return mockDelay(mock.find((p) => p.id === id))
    },
    () => client.patch(`/projects/${id}`, patch).then((r) => r.data)
  )
}
