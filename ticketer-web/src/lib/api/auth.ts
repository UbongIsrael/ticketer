import { api } from '../axios';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
  auth_provider: string | null;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

export interface OTPRequestResponse {
  message: string;
  identifier: string;
}

export interface OTPVerifyRequest {
  identifier: string;
  code: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
}

// Request OTP (public)
export const requestOTP = async (identifier: string): Promise<OTPRequestResponse> => {
  const response = await api.post('/auth/otp/request', { identifier });
  return response.data;
};

// Verify OTP and get tokens (public)
export const verifyOTP = async (data: OTPVerifyRequest): Promise<AuthTokenResponse> => {
  const response = await api.post('/auth/otp/verify', data);
  return response.data;
};

// Refresh access token (public)
export const refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
  return response.data;
};

// Google OAuth redirect URL (public)
export const getGoogleAuthUrl = (): string => {
  const baseURL = api.defaults.baseURL || 'http://localhost:3000';
  return `${baseURL}/auth/google`;
};

// Apple OAuth redirect URL (public)
export const getAppleAuthUrl = (): string => {
  const baseURL = api.defaults.baseURL || 'http://localhost:3000';
  return `${baseURL}/auth/apple`;
};
