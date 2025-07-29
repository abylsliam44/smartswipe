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
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10"
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
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SmartSwipe</span>
          </motion.button>

          {/* Right side - Navigation items */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Profile Button */}
                <motion.button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium hidden sm:block">
                    {user.email?.split('@')[0] || 'Profile'}
                  </span>
                </motion.button>

                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium hidden sm:block">
                    Logout
                  </span>
                </motion.button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
                <motion.button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
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