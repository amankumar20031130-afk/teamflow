import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => api.put(`/projects/${id}/members/${userId}/role`, data),
};

export const taskAPI = {
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  getMyTasks: (params) => api.get('/tasks/my', { params }),
  getDashboardStats: () => api.get('/tasks/dashboard'),
};

export const userAPI = {
  search: (q) => api.get('/users/search', { params: { q } }),
  getOne: (id) => api.get(`/users/${id}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // Projects
  getProjects: (params) => api.get('/admin/projects', { params }),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  // Tasks
  getTasks: (params) => api.get('/admin/tasks', { params }),
};

export default api;
