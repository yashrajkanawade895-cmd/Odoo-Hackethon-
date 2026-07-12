// One place to import every module's API surface from.
// Usage: import { api } from '../api'; api.assets.getAssets(...)
import * as auth from './auth.js'
import * as dashboard from './dashboard.js'
import * as departments from './departments.js'
import * as categories from './categories.js'
import * as employees from './employees.js'
import * as assets from './assets.js'
import * as allocations from './allocations.js'
import * as transfers from './transfers.js'
import * as bookings from './bookings.js'
import * as maintenance from './maintenance.js'
import * as audits from './audits.js'
import * as notifications from './notifications.js'
import * as logs from './logs.js'
import * as reports from './reports.js'
import * as projects from './projects.js'

export const api = {
  auth,
  dashboard,
  departments,
  categories,
  employees,
  assets,
  allocations,
  transfers,
  bookings,
  maintenance,
  audits,
  notifications,
  logs,
  reports,
  projects,
}

export { USE_MOCKS } from './client.js'
