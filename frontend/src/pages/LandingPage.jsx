import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Zap, Target } from 'lucide-react'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.onboarding_completed) {
        navigate('/swipe')
      } else {
        navigate('/onboarding')
      }
    } else {
      navigate('/register')
    }
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="flex-1 flex items-center justify-center relative min-h-[calc(100vh-160px)]">
      {/* Hero Section */}
      <motion.div 
        className="text-center z-10 max-w-4xl mx-auto px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800 text-sm font-medium">AI-Powered Startup Discovery</span>
          <Zap className="w-4 h-4 text-blue-600" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-blue-900 mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Find Your Perfect
          <br />
          <span className="bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">
            Startup Idea
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-lg md:text-xl text-blue-700 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Swipe through AI-generated startup ideas, find your passion, and get 
          personalized recommendations for your next venture.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button
            onClick={handleGetStarted}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 justify-center group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {!isAuthenticated && (
            <button
              onClick={handleLogin}
              className="btn-secondary text-lg px-8 py-4"
            >
              Login
            </button>
          )}
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="card p-6 text-center">
            <Zap className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">AI-Generated Ideas</h3>
            <p className="text-blue-700 text-sm">Discover unique startup concepts powered by advanced AI technology</p>
          </div>

          <div className="card p-6 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Personalized</h3>
            <p className="text-blue-700 text-sm">Get recommendations tailored to your interests and preferences</p>
          </div>

          <div className="card p-6 text-center">
            <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Swipe to Discover</h3>
            <p className="text-blue-700 text-sm">Intuitive Tinder-like interface for exploring startup opportunities</p>
          </div>
        </motion.div>
      </motion.div>
      {/* Убраны плавающие градиентные элементы для более строгого дизайна */}
    </div>
  )
}

export default LandingPage 