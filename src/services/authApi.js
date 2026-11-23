import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: 'Admin@123',
};

// Local in-memory OTP fallback for testing if backend is offline
let localOtpRecord = null;

export const authApi = {
  /**
   * Step 1: Submit email & password, triggers OTP generation
   */
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { timeout: 5000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      console.warn('Backend auth unreachable, falling back to local credentials & OTP:', err.message);
    }

    // Local fallback check
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
      const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localOtpRecord = {
        email: normalizedEmail,
        otp: devOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
      return {
        success: true,
        requiresOtp: true,
        message: `Verification code sent to ${normalizedEmail}`,
        data: {
          email: normalizedEmail,
          devOtp: devOtp,
          expiresInSeconds: 300,
        },
      };
    } else {
      throw new Error('Invalid email or password');
    }
  },

  /**
   * Step 2: Verify the 6-digit OTP code
   */
  verifyOtp: async (email, otp) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/verify-otp`,
        { email, otp },
        { timeout: 5000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      console.warn('Backend verify-otp unreachable, falling back to local check:', err.message);
    }

    // Local fallback check
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (
      localOtpRecord &&
      localOtpRecord.email === normalizedEmail &&
      localOtpRecord.otp === otp.trim() &&
      Date.now() <= localOtpRecord.expiresAt
    ) {
      localOtpRecord = null;
      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          token: 'erp-token-' + btoa(`${email}:${Date.now()}`),
          user: {
            id: 'admin-001',
            name: 'Administrator',
            email: ADMIN_CREDENTIALS.email,
            role: 'Super Admin',
          },
        },
      };
    } else {
      throw new Error('Invalid or expired OTP code');
    }
  },

  /**
   * Resend a fresh OTP to the email
   */
  resendOtp: async (email) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/resend-otp`,
        { email },
        { timeout: 5000 }
      );
      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      console.warn('Backend resend-otp unreachable, falling back to local generation:', err.message);
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localOtpRecord = {
      email: normalizedEmail,
      otp: devOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    return {
      success: true,
      message: `A new verification code has been sent to ${normalizedEmail}`,
      data: {
        email: normalizedEmail,
        devOtp: devOtp,
      },
    };
  },
};
