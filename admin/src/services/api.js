import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  blockCustomer: (id, days, reason) => api.post(`/admin/customers/${id}/block`, { days, reason }),
  unblockCustomer: (id) => api.post(`/admin/customers/${id}/unblock`),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getStaff: () => api.get('/admin/staff'),
  assignStaff: (data) => api.post('/admin/assign-staff', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getVehiclesWithBookings: () => api.get('/admin/vehicles'),
};

export const serviceAPI = {
  getAll: (params) => api.get('/admin/services', { params }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  toggleActive: (id) => api.patch(`/services/${id}/disable`),
};

export const vehicleAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getOne: (id) => api.get(`/vehicles/${id}`),
};

export const bookingAPI = {
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  markNoShow: (id) => api.patch(`/bookings/${id}/no-show`),
  verifyCode: (code) => api.get(`/bookings/verify/${encodeURIComponent(code)}`),
};

export const staffAPI = {
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  toggleActive: (id) => api.patch(`/staff/${id}/disable`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`),
};

export default api;
