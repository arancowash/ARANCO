import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (!authToken) {
    authToken = await SecureStore.getItemAsync('authToken');
  }
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getOne: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const serviceAPI = {
  getAll: () => api.get('/services'),
  getOne: (id) => api.get(`/services/${id}`),
};

export const availabilityAPI = {
  getSlots: (date) => api.get(`/availability?date=${date}`),
};

export const bookingAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  remove: (id) => api.delete(`/bookings/${id}`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.patch('/notifications/read'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getBookingCounts: (from, to) => api.get('/admin/bookings/count-by-date', { params: { from, to } }),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  blockCustomer: (id, days, reason) => api.post(`/admin/customers/${id}/block`, { days, reason }),
  unblockCustomer: (id) => api.post(`/admin/customers/${id}/unblock`),
  getVehiclesWithBookings: () => api.get('/admin/vehicles'),
  getStaff: () => api.get('/admin/staff'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  assignStaff: (data) => api.post('/admin/assign-staff', data),
};

export const adminServiceAPI = {
  getAll: (params) => api.get('/admin/services', { params }),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  toggleActive: (id) => api.patch(`/services/${id}/disable`),
};

export const adminStaffAPI = {
  getAll: () => api.get('/admin/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  toggleActive: (id) => api.patch(`/staff/${id}/disable`),
};

export const adminBookingAPI = {
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  markNoShow: (id) => api.patch(`/bookings/${id}/no-show`),
  verifyCode: (code) => api.get(`/bookings/verify/${encodeURIComponent(code)}`),
};

export const pushAPI = {
  registerToken: (token) => api.post('/auth/push-token', { token }),
};

export default api;
