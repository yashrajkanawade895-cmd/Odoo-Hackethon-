// Placeholder data — swap for real API responses once backend endpoints exist.

export const kpisByRole = {
  admin: [
    { label: 'Assets available', value: 324, stripe: 'available', icon: 'Package' },
    { label: 'Assets allocated', value: 842, stripe: 'allocated', icon: 'ArrowLeftRight' },
    { label: 'Maintenance today', value: 18, stripe: 'maintenance', icon: 'Wrench' },
    { label: 'Active bookings', value: 27, stripe: 'allocated', icon: 'Calendar' },
    { label: 'Pending transfers', value: 12, stripe: 'reserved', icon: 'RefreshCw' },
    { label: 'Upcoming returns', value: 45, stripe: 'available', icon: 'Clock' },
    { label: 'Overdue returns', value: 7, stripe: 'lost', icon: 'AlertTriangle' },
  ],
  dept_head: [
    { label: 'Assets available', value: 42, stripe: 'available', icon: 'Package' },
    { label: 'Assets allocated', value: 128, stripe: 'allocated', icon: 'ArrowLeftRight' },
    { label: 'Maintenance today', value: 6, stripe: 'maintenance', icon: 'Wrench' },
    { label: 'Active bookings', value: 5, stripe: 'allocated', icon: 'Calendar' },
    { label: 'Overdue returns', value: 2, stripe: 'lost', icon: 'AlertTriangle' },
  ],
  asset_manager: [
    { label: 'Assets available', value: 324, stripe: 'available', icon: 'Package' },
    { label: 'Assets allocated', value: 842, stripe: 'allocated', icon: 'ArrowLeftRight' },
    { label: 'Maintenance today', value: 18, stripe: 'maintenance', icon: 'Wrench' },
    { label: 'Pending transfers', value: 12, stripe: 'reserved', icon: 'RefreshCw' },
    { label: 'Overdue returns', value: 7, stripe: 'lost', icon: 'AlertTriangle' },
  ],
  employee: [
    { label: 'My allocated assets', value: 2, stripe: 'allocated', icon: 'Package' },
  ],
}

export const shortcuts = [
  { key: 'assets', label: 'Assets', icon: 'Package' },
  { key: 'allocations', label: 'Allocations', icon: 'ArrowLeftRight' },
  { key: 'bookings', label: 'Bookings', icon: 'Calendar' },
  { key: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
  { key: 'audit', label: 'Audit', icon: 'ClipboardCheck' },
]

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
