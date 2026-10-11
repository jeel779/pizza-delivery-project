const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = (requireAuth: boolean = false) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = localStorage.getItem('pizza_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const api = {
  get: async (endpoint: string, requireAuth: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(requireAuth),
    });
    return response.json();
  },

  post: async (endpoint: string, body: any, requireAuth: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(requireAuth),
      body: JSON.stringify(body),
    });
    return response.json();
  },

  put: async (endpoint: string, body: any, requireAuth: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(requireAuth),
      body: JSON.stringify(body),
    });
    return response.json();
  },

  delete: async (endpoint: string, requireAuth: boolean = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(requireAuth),
    });
    return response.json();
  },
};
export default api;
