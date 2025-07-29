import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Проверяем аутентификацию при загрузке компонента
    checkAuth()
  }, [checkAuth])

  // Если не авторизован, редиректим на логин с сохранением попытки перехода
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default ProtectedRoute 