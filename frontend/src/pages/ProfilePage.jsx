import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, Calendar, Lightbulb, Settings, Edit } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { profileAPI } from '../lib/api'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [savedIdeas, setSavedIdeas] = useState([])
  const [userStats, setUserStats] = useState({
    totalSwipes: 0,
    totalLikes: 0,
    totalIdeas: 0,
    cyclesCompleted: 0
  })

  useEffect(() => {
    // Load saved ideas from localStorage (placeholder until backend endpoint ready)
    const saved = localStorage.getItem('savedIdeas')
    if (saved) {
      setSavedIdeas(JSON.parse(saved))
    }

    // Fetch real statistics from backend
    const loadStats = async () => {
      try {
        const stats = await profileAPI.getUserStats()
        setUserStats({
          totalSwipes: stats.swiped ?? stats.total_available ?? 0,
          totalLikes: stats.liked ?? 0,
          totalIdeas: savedIdeas.length,
          cyclesCompleted: stats.cycles_completed ?? 0
        })
      } catch (err) {
        console.error('Failed to load user stats', err)
      }
    }

    loadStats()
  }, [savedIdeas.length])

  const getDomainIcon = (domain) => {
    const icons = {
      'FinTech': '💳',
      'HealthTech': '🏥',
      'EdTech': '🎓',
      'E-commerce': '🛒',
      'Gaming': '🎮',
      'SaaS': '☁️',
      'AI/ML': '🤖',
      'Sustainability': '🌱'
    }
    return icons[domain] || '💡'
  }

  const getDomainColor = (domain) => {
    const colors = {
      'FinTech': 'from-blue-500 to-cyan-500',
      'HealthTech': 'from-green-500 to-emerald-500',
      'EdTech': 'from-purple-500 to-pink-500',
      'E-commerce': 'from-orange-500 to-red-500',
      'Gaming': 'from-indigo-500 to-purple-500',
      'SaaS': 'from-teal-500 to-blue-500',
      'AI/ML': 'from-pink-500 to-rose-500',
      'Sustainability': 'from-emerald-500 to-green-500'
    }
    return colors[domain] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header 
        className="container mx-auto px-6 py-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Your Profile</h1>
          <p className="text-blue-700">Track your progress and saved ideas</p>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* User Info */}
          <motion.div 
            className="card p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              {/* User Basic Info */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-10 h-10 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    {user?.email || 'User'}
                  </h2>
                  <p className="text-blue-700">
                    Member since {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/profile/domains')}
                  className="btn-secondary px-6 py-2 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Domains</span>
                </button>
                <button
                  onClick={() => navigate('/swipe')}
                  className="btn-primary px-6 py-2"
                >
                  Start New Cycle
                </button>
              </div>
            </div>
          </motion.div>

          {/* User Domains */}
          {user?.selected_domains && user.selected_domains.length > 0 && (
            <motion.div 
              className="card p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">Your Interests</h3>
                <button
                  onClick={() => navigate('/profile/domains')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {user.selected_domains.map((domain, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-2 bg-white border border-blue-100 rounded-lg p-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${getDomainColor(domain)} rounded-lg flex items-center justify-center text-sm`}>
                      {getDomainIcon(domain)}
                    </div>
                    <span className="text-blue-800 text-sm font-medium">{domain}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <motion.div 
              className="card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-900 mb-1">{userStats.totalSwipes}</div>
              <div className="text-blue-700 text-sm">Total Swipes</div>
            </motion.div>

            <motion.div 
              className="card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-900 mb-1">{userStats.totalLikes}</div>
              <div className="text-blue-700 text-sm">Ideas Liked</div>
            </motion.div>

            <motion.div 
              className="card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Lightbulb className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-900 mb-1">{userStats.totalIdeas}</div>
              <div className="text-blue-700 text-sm">Saved Ideas</div>
            </motion.div>

            <motion.div 
              className="card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-900 mb-1">{userStats.cyclesCompleted}</div>
              <div className="text-blue-700 text-sm">Cycles Completed</div>
            </motion.div>
          </div>

          {/* Saved Ideas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-900">Saved Ideas</h3>
              <button
                onClick={() => navigate('/swipe')}
                className="btn-primary px-6 py-2"
              >
                Start New Cycle
              </button>
            </div>

            {savedIdeas.length === 0 ? (
              <div className="card p-12 text-center">
                <Lightbulb className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-blue-900 mb-2">No Saved Ideas Yet</h4>
                <p className="text-blue-700 mb-6">
                  Start swiping to discover and save your favorite ideas!
                </p>
                <button
                  onClick={() => navigate('/swipe')}
                  className="btn-primary"
                >
                  Start Discovering
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedIdeas.map((idea, index) => (
                  <motion.div
                    key={idea.id}
                    className="card p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Domain Icon */}
                    <div className={`w-12 h-12 bg-gradient-to-r ${getDomainColor(idea.domain)} rounded-xl flex items-center justify-center mb-4 text-2xl`}>
                      {getDomainIcon(idea.domain)}
                    </div>

                    {/* Domain */}
                    <div className="text-sm text-blue-600 mb-2">
                      {idea.domain}
                    </div>

                    {/* Title */}
                    <h4 className="text-lg font-bold text-blue-900 mb-3">
                      {idea.title}
                    </h4>

                    {/* Description */}
                    <p className="text-blue-700 text-sm mb-4 line-clamp-3">
                      {idea.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {idea.tags?.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Saved Date */}
                    <div className="text-xs text-blue-600">
                      Saved {new Date(idea.savedAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfilePage 