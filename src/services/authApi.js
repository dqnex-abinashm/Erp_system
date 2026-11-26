import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const authApi = {
  /**
   * Step 1: Submit email & password, triggers OTP generation on the backend
   */
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { timeout: 8000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Login failed');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        throw new Error('Unable to connect to ERP Server (Port 3000). Please ensure backend is running.');
      }
      throw new Error(err.message || 'Login request failed');
    }
  },

  /**
   * Step 2: Verify the 6-digit OTP code strictly against the backend
   */
  verifyOtp: async (email, otp) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/verify-otp`,
        { email, otp },
        { timeout: 8000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'OTP verification failed');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        throw new Error('Unable to connect to ERP Server. Please ensure backend is running.');
      }
      throw new Error(err.message || 'Failed to verify OTP');
    }
  },

  /**
   * Resend a fresh OTP to the email from the backend
   */
  resendOtp: async (email) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/resend-otp`,
        { email },
        { timeout: 8000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
      throw new Error(response.data?.message || 'Failed to resend OTP');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        throw new Error('Unable to connect to ERP Server. Please ensure backend is running.');
      }
      throw new Error(err.message || 'Failed to resend OTP');
    }
  },

  /**
   * Logout active backend session
   */
  logout: async (token) => {
    try {
      if (!token) return;
      await axios.post(
        `${BASE_URL}/auth/logout`,
        { token },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );
    } catch {
      // Ignore network errors on logout
    }
  },
};
