import { motion } from 'framer-motion'
import { Star, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Navbar = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 cursor-pointer transition-opacity hover:opacity-80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/logo.png" alt="SmartSwipe" className="w-8 h-8 rounded" />
            <span className="text-xl font-bold text-blue-800">SmartSwipe</span>
          </motion.button>

          {/* Right side - Navigation items */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Profile Button */}
                <motion.button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 text-blue-700 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-4 h-4 text-blue-700" />
                  <span className="text-blue-700 text-sm font-medium hidden sm:block">
                    {user.email?.split('@')[0] || 'Profile'}
                  </span>
                </motion.button>

                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 text-sm font-medium hidden sm:block">
                    Logout
                  </span>
                </motion.button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-blue-800 hover:text-blue-900 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
                <motion.button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar 