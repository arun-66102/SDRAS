/**
 * API client — fetch wrapper with session cookie support
 */
const BASE = ''  // same-origin; Vite proxy handles /api → Flask

async function request(url, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const res = await fetch(`${BASE}${url}`, config)

  // Handle 401 — session expired
  if (res.status === 401) {
    // Only redirect if not already on login-related endpoint
    if (!url.includes('/api/auth/')) {
      window.location.href = '/login'
      return
    }
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }

  return data
}

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
}
