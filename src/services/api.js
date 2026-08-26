import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('courier_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('courier_token')
      localStorage.removeItem('courier_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}
export const logout = () => api.post('/auth/logout')

// ── Dashboard ─────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getRecentParcels = () => api.get('/dashboard/recent-parcels')

// ── Users (admin) ────────────────────────────────────────────────
export const getUsers = () => api.get('/users/')
export const createUser = (data) => api.post('/users/', data)
export const toggleUser = (id) => api.patch(`/users/${id}/toggle`)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// ── Customers ─────────────────────────────────────────────────────
export const getCustomers = (params) => api.get('/customers/', { params })
export const createCustomer = (data) => api.post('/customers/', data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)

// ── Couriers ──────────────────────────────────────────────────────
export const getCouriers = () => api.get('/couriers/')
export const createCourier = (data) => api.post('/couriers/', data)
export const toggleCourier = (id) => api.patch(`/couriers/${id}/toggle`)
export const deleteCourier = (id) => api.delete(`/couriers/${id}`)

// ── Branches ──────────────────────────────────────────────────────
export const getBranches = () => api.get('/branches/')
export const createBranch = (data) => api.post('/branches/', data)
export const deleteBranch = (id) => api.delete(`/branches/${id}`)

// ── Parcels ───────────────────────────────────────────────────────
export const getParcels = (params) => api.get('/parcels/', { params })
export const bookParcel = (data) => api.post('/parcels/book', data)
export const getParcel = (id) => api.get(`/parcels/${id}`)
export const updateParcelStatus = (id, data) => api.patch(`/parcels/${id}/status`, data)
export const bulkUpdateStatus = (data) => api.post('/parcels/bulk-status', data)
export const getParcelReceipt = (id) => api.get(`/parcels/${id}/receipt`, { responseType: 'blob' })
export const resendEmail = (id) => api.post(`/parcels/${id}/resend-email`)
export const addDeliveryProof = (id, data) => api.post(`/parcels/${id}/delivery-proof`, data)

// ── Cost Calculator ───────────────────────────────────────────────
export const estimateCost = (data) => api.post('/cost/estimate', data)

// ── Analytics ─────────────────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics/summary')
export const getAnalyticsWeekly = () => api.get('/analytics/weekly')
export const getAnalyticsMonthly = () => api.get('/analytics/monthly')
export const getBranchPerformance = () => api.get('/analytics/branch-performance')
export const getRevenueData = () => api.get('/analytics/revenue')

// ── Public Tracking ───────────────────────────────────────────────
export const trackParcel = (trackingNo) => {
  const publicApi = axios.create({ baseURL: BASE_URL })
  return publicApi.get(`/track/${trackingNo}`)
}

export default api
