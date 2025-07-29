import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Star, CheckCircle } from 'lucide-react'

const ResultsPage = () => {
  const navigate = useNavigate()
  const [likedIdeas, setLikedIdeas] = useState([])
  const [selectedIdeas, setSelectedIdeas] = useState([])

  useEffect(() => {
    // Load liked ideas from localStorage
    const savedLikedIdeas = localStorage.getItem('likedIdeas')
    if (savedLikedIdeas) {
      setLikedIdeas(JSON.parse(savedLikedIdeas))
    }
  }, [])

  const handleIdeaToggle = (idea) => {
    setSelectedIdeas(prev => {
      if (prev.find(i => i.id === idea.id)) {
        return prev.filter(i => i.id !== idea.id)
      } else if (prev.length < 5) {
        return [...prev, idea]
      } else {
        return prev
      }
    })
  }

  const handleContinue = () => {
    if (selectedIdeas.length === 0) return
    
    // Save selected ideas to localStorage
    localStorage.setItem('selectedIdeas', JSON.stringify(selectedIdeas))
    navigate('/questionnaire')
  }

  const handleNewCycle = () => {
    // Clear localStorage
    localStorage.removeItem('likedIdeas')
    localStorage.removeItem('selectedIdeas')
    navigate('/swipe')
  }

  if (likedIdeas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Liked Ideas</h2>
          <p className="text-white/70 mb-6">You haven't liked any ideas yet.</p>
          <button onClick={handleNewCycle} className="btn-primary">
            Start Swiping
          </button>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-white mb-2">Your Favorite Ideas</h1>
          <p className="text-white/70">Select up to 5 ideas for personalized recommendations</p>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Progress */}
          <div className="text-center mb-12">
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedIdeas.length / 5) * 100}%` }}
              />
            </div>
            <p className="text-white/70">
              Selected: {selectedIdeas.length} of 5 ideas
            </p>
          </div>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {likedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                className={`card cursor-pointer transition-all duration-300 ${
                  selectedIdeas.find(i => i.id === idea.id)
                    ? 'ring-2 ring-purple-400 bg-purple-500/20'
                    : 'hover:ring-1 hover:ring-white/30 hover:bg-white/5'
                }`}
                onClick={() => handleIdeaToggle(idea)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-6">
                  {/* Domain */}
                  <div className="text-sm text-purple-400 mb-3">
                    {idea.domain}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-3">
                    {idea.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/70 text-sm mb-4 line-clamp-3">
                    {idea.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {idea.tags?.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Selection indicator */}
                  {selectedIdeas.find(i => i.id === idea.id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center justify-center"
                    >
                      <CheckCircle className="w-6 h-6 text-purple-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <button
              onClick={handleContinue}
              disabled={selectedIdeas.length === 0}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue with {selectedIdeas.length} ideas</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleNewCycle}
              className="btn-secondary text-lg px-8 py-4"
            >
              Start New Discovery Cycle
            </button>
          </motion.div>

          {selectedIdeas.length === 0 && (
            <p className="text-white/60 text-sm text-center mt-4">
              Please select at least one idea to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ResultsPage 