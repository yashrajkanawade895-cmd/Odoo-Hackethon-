// Placeholder data — swap for real API responses once backend endpoints exist.

export const kpisByRole = {
  admin: [
    { label: 'Assets available', value: 248, stripe: 'available' },
    { label: 'Assets allocated', value: 512, stripe: 'allocated' },
    { label: 'Maintenance today', value: 6, stripe: 'maintenance' },
    { label: 'Active bookings', value: 34, stripe: 'allocated' },
    { label: 'Pending transfers', value: 9, stripe: 'reserved' },
    { label: 'Upcoming returns', value: 21, stripe: 'available' },
  ],
  departmentHead: [
    { label: 'Assets available', value: 42, stripe: 'available' },
    { label: 'Assets allocated', value: 88, stripe: 'allocated' },
    { label: 'Maintenance today', value: 2, stripe: 'maintenance' },
    { label: 'Active bookings', value: 7, stripe: 'allocated' },
    { label: 'Pending transfers', value: 3, stripe: 'reserved' },
    { label: 'Upcoming returns', value: 5, stripe: 'available' },
  ],
  employee: [
    { label: 'My allocated assets', value: 3, stripe: 'allocated' },
    { label: 'My active bookings', value: 1, stripe: 'available' },
  ],
}

export const overdueItems = [
  { id: 'AF-0114', type: 'Return', detail: 'Laptop — held by Priya Sharma', dueDate: '2026-07-08' },
  { id: 'RB-2231', type: 'Booking', detail: 'Room B2 — not checked out', dueDate: '2026-07-10' },
  { id: 'MR-0091', type: 'Maintenance', detail: 'Forklift AF-0322 — approval pending', dueDate: '2026-07-09' },
]

export const upcomingItems = [
  { id: 'AF-0207', type: 'Return', detail: 'Projector — held by Dept. of Design', dueDate: '2026-07-14' },
  { id: 'RB-2250', type: 'Booking', detail: 'Conference Room A, 3:00–4:00 PM', dueDate: '2026-07-13' },
  { id: 'MR-0104', type: 'Maintenance', detail: 'AC Unit AF-0450 — technician assigned', dueDate: '2026-07-15' },
]

export const quickActions = [
  { key: 'register', label: 'Register asset' },
  { key: 'book', label: 'Book resource' },
  { key: 'maintenance', label: 'Raise maintenance request' },
]
