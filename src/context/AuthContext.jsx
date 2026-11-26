import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('erp_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('erp_auth_token') || null);
  const [loading, setLoading] = useState(false);

  /**
   * Step 1: Validate credentials and request OTP
   */
  const initiateLogin = async (email, password) => {
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Invalid email or password',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and establish session
   */
  const verifyOtpAndLogin = async (email, otp) => {
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(email, otp);
      if (result.success && result.data) {
        const loggedUser = result.data.user;
        const authToken = result.data.token;
        setUser(loggedUser);
        setToken(authToken);
        localStorage.setItem('erp_auth_user', JSON.stringify(loggedUser));
        localStorage.setItem('erp_auth_token', authToken);
        return { success: true };
      }
      return { success: false, message: result.message || 'OTP verification failed' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Invalid or expired OTP code',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP code
   */
  const resendOtpCode = async (email) => {
    try {
      return await authApi.resendOtp(email);
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to resend OTP',
      };
    }
  };

  const logout = () => {
    const currentToken = token || localStorage.getItem('erp_auth_token');
    if (currentToken) {
      authApi.logout(currentToken);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('erp_auth_user');
    localStorage.removeItem('erp_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        initiateLogin,
        verifyOtpAndLogin,
        resendOtpCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
