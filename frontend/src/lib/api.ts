const DEFAULT_PROD_URL = 'https://smart-billing-nubr.onrender.com';

const env = (import.meta as any).env || {};

export const API_BASE_URL = (
  env.VITE_API_URL || 
  (env.PROD ? DEFAULT_PROD_URL : '')
).replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

export function getAuthHeaders(contentType = false) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}
