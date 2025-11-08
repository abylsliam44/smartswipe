import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Trophy, Medal, Award, Sparkles, AlertTriangle } from 'lucide-react'

const TopIdeasPage = () => {
  const navigate = useNavigate()
  const [likedIdeas, setLikedIdeas] = useState([])
  const [selectedIdeas, setSelectedIdeas] = useState([])
  const [error, setError] = useState(null)
  const [showInsufficientIdeasModal, setShowInsufficientIdeasModal] = useState(false)

  useEffect(() => {
    // Загружаем понравившиеся идеи
    const stored = localStorage.getItem('likedIdeas')
    if (stored) {
      const ideas = JSON.parse(stored)
      
      if (ideas.length < 3) {
        setError('You need at least 3 liked ideas to proceed')
        return
      }
      
      setLikedIdeas(ideas)
    } else {
      setError('No liked ideas found')
    }
  }, [])

  const handleIdeaSelect = (idea) => {
    if (selectedIdeas.find(selected => selected.id === idea.id)) {
      // Убираем из выбранных
      setSelectedIdeas(prev => prev.filter(selected => selected.id !== idea.id))
    } else if (selectedIdeas.length < 3) {
      // Добавляем в выбранные
      setSelectedIdeas(prev => [...prev, idea])
    }
  }

  const handleContinue = () => {
    if (selectedIdeas.length !== 3) {
      setShowInsufficientIdeasModal(true)
      return
    }
    
    // Сохраняем топ-3 идеи в localStorage
    localStorage.setItem('topIdeas', JSON.stringify(selectedIdeas))
    
    // Также сохраняем выбранные идеи отдельно для квестionnaire
    localStorage.setItem('selectedIdeas', JSON.stringify(selectedIdeas))
    
    console.log('Saving topIdeas:', selectedIdeas)
    console.log('Saved to localStorage successfully')
    
    // Переходим к опроснику
    navigate('/questionnaire')
  }

  const getMedalInfo = (position) => {
    const medals = [
      { icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-600', name: 'Gold Medal' },
      { icon: Medal, color: 'text-gray-700', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-700', name: 'Silver Medal' },
      { icon: Award, color: 'text-amber-700', bgColor: 'bg-amber-600/20', borderColor: 'border-amber-700', name: 'Bronze Medal' }
    ]
    return medals[position] || medals[0]
  }

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
    return icons[domain] || '✨'
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
    return colors[domain] || 'from-yellow-500 to-orange-500'
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="card p-8 text-center max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Not Enough Ideas</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/swipe')}
            className="btn-primary"
          >
            Back to Swiping
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Insufficient Ideas Modal */}
      {showInsufficientIdeasModal && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="card p-8 text-center max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select 3 Ideas</h2>
            <p className="text-gray-700 mb-2">
              Please select exactly 3 ideas to continue.
            </p>
            <p className="text-gray-700 mb-6">
              You currently have {selectedIdeas.length} selected. 
              {selectedIdeas.length < 3 ? ` You need ${3 - selectedIdeas.length} more.` : ' Please remove some selections.'}
            </p>
            <button
              onClick={() => setShowInsufficientIdeasModal(false)}
              className="btn-primary w-full"
            >
              Continue Selecting
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <motion.header 
        className="container mx-auto px-6 py-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/results')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Choose Your Top 3</h1>
              <p className="text-blue-700">Select the 3 most promising ideas</p>
            </div>
          </div>
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
          {/* Progress */}
          <div className="text-center mb-12">
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedIdeas.length / 3) * 100}%` }}
              />
            </div>
            <p className="text-blue-700">
              Selected: {selectedIdeas.length} of 3 ideas
            </p>
          </div>

          {/* Selected Ideas (Top 3) */}
          {selectedIdeas.length > 0 && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
                Your Top {selectedIdeas.length} Ideas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedIdeas.map((idea, index) => {
                  const medal = getMedalInfo(index)
                  const MedalIcon = medal.icon
                  
                  return (
                    <motion.div
                      key={idea.id}
                    className={`card relative border-2 ${medal.borderColor}`}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Medal */}
                      <div className="absolute -top-4 -right-4 z-10">
                        <div className={`w-12 h-12 ${medal.bgColor} rounded-full flex items-center justify-center border-2 ${medal.borderColor}`}>
                          <MedalIcon className={`w-6 h-6 ${medal.color}`} />
                        </div>
                      </div>

                      {/* Position Number */}
                      <div className="absolute top-4 left-4">
                        <div className={`w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-bold ${medal.color}`}>
                          {index + 1}
                        </div>
                      </div>

                      <div className="p-6 pt-8">
                        {/* Domain Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-r ${getDomainColor(idea.domain)} rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                          {getDomainIcon(idea.domain)}
                        </div>

                        {/* Domain */}
                        <div className="text-sm font-semibold text-blue-700 mb-2 text-center">
                          {idea.domain}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-blue-900 mb-3 text-center">
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

                        {/* Remove button */}
                        <button
                          onClick={() => handleIdeaSelect(idea)}
                          className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          Remove from top 3
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Available Ideas */}
          {selectedIdeas.length < 3 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: selectedIdeas.length > 0 ? 0.6 : 0.3 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
                Choose from Your Liked Ideas ({likedIdeas.length} available)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedIdeas
                  .filter(idea => !selectedIdeas.find(selected => selected.id === idea.id))
                  .map((idea, index) => (
                    <motion.div
                      key={idea.id}
                      className="card cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleIdeaSelect(idea)}
                    >
                      <div className="p-6">
                        {/* Domain Icon */}
                        <div className={`w-12 h-12 bg-gradient-to-r ${getDomainColor(idea.domain)} rounded-xl flex items-center justify-center mb-4 text-2xl`}>
                          {getDomainIcon(idea.domain)}
                        </div>

                        {/* Domain */}
                        <div className="text-sm font-semibold text-purple-800 mb-2">
                          {idea.domain}
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-gray-900 mb-3">
                          {idea.title}
                        </h4>

                        {/* Description */}
                        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                          {idea.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {idea.tags?.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-purple-50 rounded-full text-xs text-purple-700 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Select button indicator */}
                        <div className="text-center">
                          <div className="inline-flex items-center space-x-2 text-purple-700 group-hover:text-purple-800 font-semibold">
                            <span className="text-sm">Add to top 3</span>
                            <div className="w-6 h-6 border-2 border-purple-700 rounded-full flex items-center justify-center group-hover:border-purple-800 group-hover:bg-purple-100 transition-colors">
                              <span className="text-xs font-bold text-purple-800">+</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <button
              onClick={handleContinue}
              disabled={selectedIdeas.length !== 3}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue with Top 3 Ideas</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {selectedIdeas.length < 3 && (
              <p className="text-gray-600 text-sm mt-4">
                Please select exactly 3 ideas to continue ({3 - selectedIdeas.length} more needed)
              </p>
            )}
          </motion.div>

          {/* Info */}
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="card p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-blue-900 mb-3">How It Works</h3>
              <p className="text-blue-700 text-sm">
                Select your 3 most promising ideas. They will be ranked with gold, silver, and bronze medals. 
                Next, you'll answer some questions to help our AI create the perfect personalized startup idea for you!
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default TopIdeasPage 