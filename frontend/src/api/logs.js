import { client, call, mockDelay } from './client.js'
import mockData from '../mocks/activityLogs.json'

// GET /activity-logs?user=&action=&from=&to= — admin only
export function getActivityLogs(params = {}) {
  return call(() => mockDelay(mockData), () => client.get('/activity-logs', { params }).then((r) => r.data))
}
