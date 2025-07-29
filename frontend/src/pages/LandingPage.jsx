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
          className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-white/90 text-sm font-medium">AI-Powered Startup Discovery</span>
          <Zap className="w-4 h-4 text-yellow-400" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Find Your Perfect
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Startup Idea
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed"
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
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Generated Ideas</h3>
            <p className="text-white/70 text-sm">Discover unique startup concepts powered by advanced AI technology</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Personalized</h3>
            <p className="text-white/70 text-sm">Get recommendations tailored to your interests and preferences</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Swipe to Discover</h3>
            <p className="text-white/70 text-sm">Intuitive Tinder-like interface for exploring startup opportunities</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 50 
            }}
            animate={{ 
              y: -50, 
              x: Math.random() * window.innerWidth 
            }}
            transition={{ 
              duration: Math.random() * 4 + 3, 
              repeat: Infinity, 
              delay: Math.random() * 3 
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default LandingPage 