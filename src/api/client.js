const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Token management
export const tokenStorage = {
  get: () => localStorage.getItem('bento_token'),
  set: (token) => localStorage.setItem('bento_token', token),
  clear: () => localStorage.removeItem('bento_token'),
}

async function request(path, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

// Full API surface reflecting docs/api-contract.md
export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (name, email, password) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    me: () => request('/auth/me'),
  },
  org: {
    departments: {
      list: () => request('/departments'),
      create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    categories: {
      list: () => request('/categories'),
      create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    employees: {
      list: (params) => {
        const q = new URLSearchParams(params || {}).toString();
        return request(`/employees${q ? `?${q}` : ''}`);
      },
      update: (id, data) => request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      promote: (id, role) => request(`/employees/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    }
  },
  assets: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/assets${q ? `?${q}` : ''}`);
    },
    get: (id) => request(`/assets/${id}`),
    create: (data) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    history: (id) => request(`/assets/${id}/history`),
  },
  allocations: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/allocations${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/allocations', { method: 'POST', body: JSON.stringify(data) }),
    returnAsset: (id, checkinNotes) => request(`/allocations/${id}/return`, { method: 'PATCH', body: JSON.stringify({ checkinNotes }) }),
  },
  transfers: {
    list: (status = 'requested') => request(`/transfers?status=${status}`),
    create: (data) => request('/transfers', { method: 'POST', body: JSON.stringify(data) }),
    decide: (id, action) => request(`/transfers/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  },
  bookings: {
    resources: () => request('/resources'),
    listForResource: (resourceId, from, to) => request(`/resources/${resourceId}/bookings?from=${from}&to=${to}`),
    myBookings: () => request('/my-bookings'),
    create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  maintenance: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/maintenance${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/maintenance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  audits: {
    list: () => request('/audit-cycles'),
    get: (id) => request(`/audit-cycles/${id}`),
    create: (data) => request('/audit-cycles', { method: 'POST', body: JSON.stringify(data) }),
    assignAuditors: (id, auditorIds) => request(`/audit-cycles/${id}/auditors`, { method: 'POST', body: JSON.stringify({ auditorIds }) }),
    updateItem: (itemId, data) => request(`/audit-items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    discrepancies: (id) => request(`/audit-cycles/${id}/discrepancies`),
    close: (id) => request(`/audit-cycles/${id}/close`, { method: 'PATCH' }),
  },
  dashboard: {
    kpis: () => request('/dashboard/kpis'),
  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
  reports: {
    utilization: () => request('/reports/utilization'),
    maintenanceFrequency: () => request('/reports/maintenance-frequency'),
    departmentAllocation: () => request('/reports/department-allocation'),
    bookingHeatmap: () => request('/reports/booking-heatmap'),
  },
  logs: {
    activity: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/activity-logs${q ? `?${q}` : ''}`);
    }
  }
}
