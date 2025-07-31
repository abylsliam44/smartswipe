import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { authAPI } from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Состояние
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Действия
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.login(credentials)
          const { access_token, token_type, user } = response
          
          // Сохраняем токен в куки
          Cookies.set('access_token', access_token, { 
            expires: 7, // 7 дней
            secure: false, // В продакшене должно быть true
            sameSite: 'lax'
          })
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'Ошибка авторизации'
          set({
            error: errorMessage,
            isLoading: false,
          })
          return { success: false, error: errorMessage }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const user = await authAPI.register(userData)
          
          // После регистрации сразу логинимся
          const loginResult = await get().login({
            email: userData.email,
            password: userData.password,
          })
          
          return loginResult
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'Ошибка регистрации'
          set({
            error: errorMessage,
            isLoading: false,
          })
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        Cookies.remove('access_token')
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },

      updateDomains: async (domains) => {
        try {
          const updatedUser = await authAPI.updateDomains(domains)
          set((state) => ({
            user: { ...state.user, ...updatedUser }
          }))
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'Ошибка обновления доменов'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },

      checkAuth: async () => {
        const token = Cookies.get('access_token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return false
        }

        try {
          const user = await authAPI.getMe()
          set({
            user,
            isAuthenticated: true,
            error: null,
          })
          return true
        } catch (error) {
          // Токен недействителен
          Cookies.remove('access_token')
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          })
          return false
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore 