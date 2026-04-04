import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Base URL without /api suffix — used to build full image URLs from relative paths like /uploads/pets/abc.jpg
export const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor - Add token to headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response Interceptor - Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Upload a file using multipart/form-data
 * @param {string} url - API endpoint path (e.g. '/v1/pets/with-image')
 * @param {FormData} formData - FormData object with fields and files
 */
export const uploadFile = (url, formData) => {
  return apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default apiClient
