// A script to override the global fetch to automatically handle 401 Unauthorized responses.
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    // Check if we are already on the login page to avoid redirect loops
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  return response;
};
