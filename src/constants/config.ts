export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://simplynivo.onrender.com',
  ENDPOINTS: {
    HEALTH: '/health',
    SIMPLIFY: '/api/simplify',
  },
  TIMEOUT: 15000,
};

export default API_CONFIG;
