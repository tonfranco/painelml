import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar accountId em todas as requisições
api.interceptors.request.use((config) => {
  const accountId = localStorage.getItem('accountId');
  
  if (accountId && config.params) {
    config.params.accountId = accountId;
  } else if (accountId) {
    config.params = { accountId };
  }
  
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login ou OAuth
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
