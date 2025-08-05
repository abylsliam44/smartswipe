import axios from 'axios'
import Cookies from 'js-cookie'

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://smartswipe-5hrt.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерсептор для автоматического добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Интерсептор для обработки ответов и ошибок аутентификации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      Cookies.remove('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    // Backend ожидает form data для логина
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  updateDomains: async (domains) => {
    const response = await api.post('/api/auth/domains', { domains })
    return response.data
  },

  getAvailableDomains: async () => {
    const response = await api.get('/api/auth/available-domains')
    return response.data
  },

  // НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ДОМЕНАМИ В ПРОФИЛЕ
  getProfileDomains: async () => {
    const response = await api.get('/api/auth/profile/domains')
    return response.data
  },
  
  addDomain: async (domainId) => {
    const response = await api.post('/api/auth/profile/domains/add', { domain_id: domainId })
    return response.data
  },
  
  addCustomDomain: async (domainName) => {
    const response = await api.post('/api/auth/profile/domains/custom', { name: domainName })
    return response.data
  },
  
  removeDomain: async (domainId) => {
    const response = await api.delete('/api/auth/profile/domains/remove', { 
      data: { domain_id: domainId } 
    })
    return response.data
  },
}

// Ideas API
export const ideasAPI = {
  generatePool: async () => {
    const response = await api.post('/api/ideas/generate-pool')
    return response.data
  },

  getGameSession: async (limit = 5) => {
    const response = await api.get(`/api/ideas/game-session?limit=${limit}`)
    return response.data
  },

  getAll: async () => {
    const response = await api.get('/api/ideas/')
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/api/ideas/stats')
    return response.data
  },
}

// Swipes API
export const swipesAPI = {
  createSwipe: async (swipeData) => {
    const response = await api.post('/api/swipes/', swipeData)
    return response.data
  },

  getHistory: async () => {
    const response = await api.get('/api/swipes/history')
    return response.data
  },

  getLiked: async () => {
    const response = await api.get('/api/swipes/liked')
    return response.data
  },

  getUserSwipes: async () => {
    const response = await api.get('/api/swipes/')
    return response.data
  },

  getLikedIdeas: async () => {
    const response = await api.get('/api/swipes/?liked_only=true')
    return response.data
  },

  getStats: async () => {
    const response = await api.get('/api/swipes/stats')
    return response.data
  },
}

// Recommendations API
export const recommendationsAPI = {
  getRecommendations: async (limit = 10) => {
    const response = await api.get(`/api/recommendations/?limit=${limit}`)
    return response.data
  },
}

// ML API
export const mlAPI = {
  trainModels: async () => {
    const response = await api.post('/api/ml/train')
    return response.data
  },

  getModelInfo: async () => {
    const response = await api.get('/api/ml/model-info')
    return response.data
  },

  getMetrics: async () => {
    const response = await api.get('/api/ml/metrics')
    return response.data
  },
}

// Profile API
export const profileAPI = {
  saveFinalIdea: async (ideaData) => {
    const response = await api.post('/api/profile/save-idea', ideaData)
    return response.data
  },

  getSavedIdeas: async () => {
    const response = await api.get('/api/profile/saved-ideas')
    return response.data
  },

  getUserStats: async () => {
    // backend route implemented under ideas router
    const response = await api.get('/api/ideas/stats')
    return response.data
  },

  updateStats: async (statsData) => {
    const response = await api.post('/api/profile/update-stats', statsData)
    return response.data
  }
}

export default api 