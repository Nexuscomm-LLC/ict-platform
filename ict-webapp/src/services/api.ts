import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/wp-json/ict/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ict_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ict_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Projects
  getProjects: (params?: Record<string, unknown>) => api.get('/projects', { params }),
  getProject: (id: number) => api.get(`/projects/${id}`),
  createProject: (data: Record<string, unknown>) => api.post('/projects', data),
  updateProject: (id: number, data: Record<string, unknown>) => api.put(`/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/projects/${id}`),

  // Time Entries
  getTimeEntries: (params?: Record<string, unknown>) => api.get('/time-entries', { params }),
  clockIn: (data: Record<string, unknown>) => api.post('/time-entries/clock-in', data),
  clockOut: (data: Record<string, unknown>) => api.post('/time-entries/clock-out', data),
  updateTimeEntry: (id: number, data: Record<string, unknown>) => api.put(`/time-entries/${id}`, data),

  // Inventory
  getInventory: (params?: Record<string, unknown>) => api.get('/inventory', { params }),
  getInventoryItem: (id: number) => api.get(`/inventory/${id}`),
  lookupBarcode: (barcode: string) => api.get(`/inventory/barcode/${barcode}`),
  updateQuantity: (id: number, quantity: number, reason?: string) =>
    api.patch(`/inventory/${id}/quantity`, { quantity, reason }),

  // Equipment
  getEquipment: (params?: Record<string, unknown>) => api.get('/equipment', { params }),
  assignEquipment: (id: number, userId: number, projectId?: number) =>
    api.post(`/equipment/${id}/assign`, { user_id: userId, project_id: projectId }),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/activity'),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
};

export default api;
