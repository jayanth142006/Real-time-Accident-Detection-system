// config.js
// Configuration constants for the application

// API URL - change this based on your environment
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Token storage key
export const TOKEN_KEY = 'token';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  ME: '/api/user/me/',
  REFRESH_TOKEN: '/api/auth/refresh/'
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};