import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/categories.json'

let mock = [...mockData]

export function getCategories() {
  return call(() => mockDelay(mock), () => client.get('/categories').then((r) => r.data))
}

export function createCategory({ name, customFields }) {
  return call(
    () => {
      const cat = { id: mock.length + 1, name, customFields: customFields || {} }
      mock = [...mock, cat]
      return mockDelay(cat)
    },
    () => client.post('/categories', { name, customFields }).then((r) => r.data)
  )
}

export function updateCategory(id, patch) {
  return call(
    () => {
      mock = mock.map((c) => (c.id === id ? { ...c, ...patch } : c))
      return mockDelay(mock.find((c) => c.id === id))
    },
    () => client.patch(`/categories/${id}`, patch).then((r) => r.data)
  )
}
