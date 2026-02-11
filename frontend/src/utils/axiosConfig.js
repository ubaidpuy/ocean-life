import axios from 'axios'

// Get the backend URL based on the current hostname
const getBackendUrl = () => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  
  // If we're on a subdomain (e.g., nike.myapp.local), use the main domain for backend
  // If we're on the main domain (myapp.local), use it directly
  if (hostname.includes('.myapp.local')) {
    // Extract subdomain
    const parts = hostname.split('.')
    // For subdomains like nike.myapp.local, backend is at myapp.local:5000
    // For main domain myapp.local, backend is at myapp.local:5000
    const baseDomain = parts.slice(-2).join('.') // Gets 'myapp.local'
    return `${protocol}//${baseDomain}:5000`
  }
  
  // Handle localhost subdomains (e.g., jjj.localhost)
  if (hostname.includes('.localhost')) {
    // For subdomains like jjj.localhost, backend is at localhost:5000
    return 'http://localhost:5000'
  }
  
  // Fallback for plain localhost or other setups
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }
  
  // Default fallback
  return 'http://myapp.local:5000'
}

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token and preserve subdomain
axiosInstance.interceptors.request.use(
  (config) => {
    // Preserve the original hostname for tenant middleware
    // This ensures the backend can identify which store/subdomain the request is from
    const currentHost = window.location.hostname
    
    // Send the current hostname in a custom header so backend can identify the subdomain
    // This is necessary because browsers set Host header to the target URL, not the origin
    if (currentHost.includes('.myapp.local') || currentHost === 'myapp.local') {
      config.headers['X-Forwarded-Host'] = currentHost
      // Also include the subdomain explicitly for easier parsing
      if (currentHost.includes('.')) {
        const subdomain = currentHost.split('.')[0]
        config.headers['X-Subdomain'] = subdomain
      }
    }
    
    // Handle localhost subdomains (e.g., jjj.localhost)
    if (currentHost.includes('.localhost')) {
      config.headers['X-Forwarded-Host'] = currentHost
      const subdomain = currentHost.split('.')[0]
      config.headers['X-Subdomain'] = subdomain
    }
    
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo)
        if (parsedUserInfo.token) {
          config.headers.Authorization = `Bearer ${parsedUserInfo.token}`
        }
      } catch (error) {
        console.error('Error parsing userInfo:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could dispatch logout action here if needed
      localStorage.removeItem('userInfo')
    }
    return Promise.reject(error)
  }
)

export default axiosInstance

