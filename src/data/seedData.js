export const seedDepartments = [
  { id: 'd1', name: 'Engineering', head: 'Priya Sharma', parent: null, status: 'active' },
  { id: 'd2', name: 'Design', head: 'Aman Singh', parent: null, status: 'active' },
  { id: 'd3', name: 'Frontend', head: 'Neha Patel', parent: 'Engineering', status: 'active' },
  { id: 'd4', name: 'Facilities', head: 'Rahul Verma', parent: null, status: 'inactive' },
]

export const seedCategories = [
  { id: 'c1', name: 'Electronics', customField: 'Warranty period (months)' },
  { id: 'c2', name: 'Furniture', customField: '—' },
  { id: 'c3', name: 'Vehicles', customField: 'Insurance expiry' },
  { id: 'c4', name: 'Rooms', customField: 'Capacity' },
]

export const seedEmployees = [
  { id: 'e1', name: 'Priya Sharma', email: 'priya@acme.com', department: 'Engineering', role: 'asset_manager', status: 'active' },
  { id: 'e2', name: 'Raj Kumar', email: 'raj@acme.com', department: 'Engineering', role: 'employee', status: 'active' },
  { id: 'e3', name: 'Aman Singh', email: 'aman@acme.com', department: 'Design', role: 'dept_head', status: 'active' },
  { id: 'e4', name: 'Neha Patel', email: 'neha@acme.com', department: 'Frontend', role: 'employee', status: 'active' },
  { id: 'e5', name: 'Rahul Verma', email: 'rahul@acme.com', department: 'Facilities', role: 'employee', status: 'inactive' },
]

export const seedAssets = [
  { id: 'a1', tag: 'AF-0114', name: 'MacBook Pro 16"', category: 'Electronics', serial: 'SN-88213X', department: 'Engineering', location: 'HQ - 3F', status: 'allocated', bookable: false },
  { id: 'a2', tag: 'AF-0207', name: 'Projector Epson X1', category: 'Electronics', serial: 'SN-40213A', department: 'Design', location: 'HQ - 2F', status: 'reserved', bookable: true },
  { id: 'a3', tag: 'AF-0322', name: 'Forklift', category: 'Vehicles', serial: 'SN-99001V', department: 'Facilities', location: 'Warehouse B', status: 'under_maintenance', bookable: false },
  { id: 'a4', tag: 'AF-0032', name: 'Ergonomic Chair', category: 'Furniture', serial: 'SN-11220F', department: 'Frontend', location: 'HQ - 3F', status: 'allocated', bookable: false },
  { id: 'a5', tag: 'AF-0450', name: 'Conference Room A', category: 'Rooms', serial: '—', department: 'Facilities', location: 'HQ - 1F', status: 'available', bookable: true },
  { id: 'a6', tag: 'AF-0501', name: 'Dell Monitor 24"', category: 'Electronics', serial: 'SN-77120M', department: 'Engineering', location: 'HQ - 3F', status: 'available', bookable: false },
]

export const seedAllocations = [
  { id: 'al1', assetTag: 'AF-0114', assetName: 'MacBook Pro 16"', holder: 'Priya Sharma', allocatedOn: '2026-05-01', expectedReturn: '2026-07-20', status: 'active' },
  { id: 'al2', assetTag: 'AF-0032', assetName: 'Ergonomic Chair', holder: 'Neha Patel', allocatedOn: '2026-04-26', expectedReturn: '2026-07-01', status: 'overdue' },
]

export const seedResources = [
  { id: 'r1', name: 'Conference Room A', tag: 'AF-0450' },
  { id: 'r2', name: 'Room B2', tag: 'AF-0451' },
  { id: 'r3', name: 'Company Van', tag: 'AF-0452' },
]

export const seedBookings = [
  { id: 'b1', resource: 'Room B2', bookedBy: 'Aman Singh', start: '2026-07-14T09:00', end: '2026-07-14T10:00', status: 'upcoming' },
  { id: 'b2', resource: 'Conference Room A', bookedBy: 'Rahul Verma', start: '2026-07-13T15:00', end: '2026-07-13T16:00', status: 'upcoming' },
]

export const seedMaintenanceRequests = [
  { id: 'm1', assetTag: 'AF-0322', issue: 'Hydraulic leak', priority: 'high', raisedBy: 'Rahul Verma', status: 'in_progress', technician: 'Suresh (Ext. Vendor)' },
  { id: 'm2', assetTag: 'AF-0450', issue: 'Projector bulb flickering', priority: 'medium', raisedBy: 'Aman Singh', status: 'pending', technician: null },
]

export const seedAuditCycles = [
  {
    id: 'ac1',
    name: 'Q3 HQ Floor 3 Audit',
    scope: 'Engineering — HQ 3F',
    dateRange: '2026-07-10 to 2026-07-17',
    status: 'open',
    auditors: ['Priya Sharma'],
    items: [
      { assetTag: 'AF-0114', assetName: 'MacBook Pro 16"', result: 'pending' },
      { assetTag: 'AF-0501', assetName: 'Dell Monitor 24"', result: 'pending' },
    ],
  },
]

export const seedNotifications = [
  { id: 'n1', type: 'Overdue return', message: 'AF-0032 is overdue for return by Neha Patel', read: false, at: '2026-07-11 09:12' },
  { id: 'n2', type: 'Maintenance approved', message: 'Maintenance request for AF-0322 approved', read: false, at: '2026-07-10 17:40' },
  { id: 'n3', type: 'Booking confirmed', message: 'Room B2 booked for Jul 14, 9:00–10:00', read: true, at: '2026-07-09 11:02' },
]

export const seedActivityLogs = [
  { id: 'log1', user: 'Priya Sharma', action: 'Approved maintenance request', entity: 'AF-0322', at: '2026-07-10 17:40' },
  { id: 'log2', user: 'Admin User', action: 'Promoted employee to Asset Manager', entity: 'Priya Sharma', at: '2026-07-09 10:15' },
  { id: 'log3', user: 'Aman Singh', action: 'Booked resource', entity: 'Room B2', at: '2026-07-09 09:50' },
]
