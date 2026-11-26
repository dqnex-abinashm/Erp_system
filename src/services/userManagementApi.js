import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('erp_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractError(err, fallback) {
  if (err.response?.data?.message) return new Error(err.response.data.message);
  if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
    return new Error('Unable to connect to ERP Server (Port 3000).');
  }
  return new Error(err.message || fallback);
}

export const userManagementApi = {
  getMeta: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/meta`, {
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to fetch user metadata');
    }
  },

  getUsers: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/users`, {
        params,
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to fetch users');
    }
  },

  getRoles: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/roles`, {
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to fetch roles');
    }
  },

  createUser: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/users`, payload, {
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to create user');
    }
  },

  updateUser: async (id, payload) => {
    try {
      const res = await axios.put(`${BASE_URL}/users/${id}`, payload, {
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to update user');
    }
  },

  updateUserStatus: async (id, isActive) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/users/${id}/status`,
        { isActive },
        {
          headers: getAuthHeaders(),
          timeout: 8000,
        }
      );
      return res.data.data;
    } catch (err) {
      throw extractError(err, 'Failed to update user status');
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await axios.delete(`${BASE_URL}/users/${id}`, {
        headers: getAuthHeaders(),
        timeout: 8000,
      });
      return res.data;
    } catch (err) {
      throw extractError(err, 'Failed to delete user');
    }
  },
};
