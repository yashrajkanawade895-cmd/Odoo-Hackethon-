import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/assets.json'

let mock = [...mockData]
let tagSeq = mock.length

// POST /assets — auto tag AF-xxxx from sequence; asset_manager only.
export function createAsset(fields) {
  return call(
    () => {
      tagSeq += 1
      const asset = { id: 100 + mock.length + 1, tag: `AF-${String(tagSeq).padStart(4, '0')}`, status: 'available', ...fields }
      mock = [...mock, asset]
      return mockDelay(asset)
    },
    () => client.post('/assets', fields).then((r) => r.data)
  )
}

// GET /assets?q=&category=&status=&department=&location=&bookable=
export function getAssets(params = {}) {
  return call(
    () => {
      let rows = mock
      if (params.q) {
        const q = params.q.toLowerCase()
        rows = rows.filter((a) => a.tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.serial || '').toLowerCase().includes(q))
      }
      if (params.category) rows = rows.filter((a) => a.category === params.category)
      if (params.status) rows = rows.filter((a) => a.status === params.status)
      if (params.department) rows = rows.filter((a) => a.department === params.department)
      if (params.location) rows = rows.filter((a) => a.location === params.location)
      if (params.bookable !== undefined) rows = rows.filter((a) => a.bookable === (params.bookable === true || params.bookable === 'true'))
      return mockDelay(rows)
    },
    () => client.get('/assets', { params }).then((r) => r.data)
  )
}

export function getAsset(id) {
  return call(
    () => mockDelay(mock.find((a) => a.id === id)),
    () => client.get(`/assets/${id}`).then((r) => r.data)
  )
}

// PATCH /assets/:id — status changes only via changeAssetStatus rules server-side;
// this covers editable fields (name, location, condition, etc).
export function updateAsset(id, patch) {
  return call(
    () => {
      mock = mock.map((a) => (a.id === id ? { ...a, ...patch } : a))
      return mockDelay(mock.find((a) => a.id === id))
    },
    () => client.patch(`/assets/${id}`, patch).then((r) => r.data)
  )
}

// GET /assets/:id/history — combined allocation + maintenance history, newest first.
export function getAssetHistory(id) {
  return call(
    () => mockDelay([]),
    () => client.get(`/assets/${id}/history`).then((r) => r.data)
  )
}
