import React, { useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { Heart, X, ArrowLeft, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ideasAPI, swipesAPI } from '../lib/api'
import useAuthStore from '../store/authStore'

const SwipePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  // State management
  const [ideas, setIdeas] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [totalSwiped, setTotalSwiped] = useState(0)
  const [likedIdeas, setLikedIdeas] = useState([])
  const [sessionStats, setSessionStats] = useState({ liked: 0, disliked: 0 })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showInsufficientLikesModal, setShowInsufficientLikesModal] = useState(false)

  // Spring animations for swipe gestures
  const x = useSpring(0)
  const scale = useSpring(1)
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0])

  // Current idea helper
  const currentIdea = ideas[currentIndex]

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!user?.onboarding_completed) {
      navigate('/onboarding')
      return
    }

    loadGameSession()
  }, [isAuthenticated, user, navigate])

  const loadGameSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Сбрасываем состояние для новой сессии
      setTotalSwiped(0)
      setLikedIdeas([])
      setSessionStats({ liked: 0, disliked: 0 })
      setCurrentIndex(0)
      localStorage.removeItem('likedIdeas')
      localStorage.removeItem('topIdeas')

      // Загружаем идеи
      const response = await ideasAPI.getGameSession(15) // Загружаем больше идей
      
      if (!response.ideas || response.ideas.length === 0) {
        // Если нет идей, генерируем новые
        await generateNewIdeas()
      } else {
        setIdeas(response.ideas)
      }
    } catch (error) {
      console.error('Error loading game session:', error)
      
      try {
        // Пытаемся сгенерировать новые идеи
        await generateNewIdeas()
      } catch (genError) {
        console.error('Error generating ideas:', genError)
        setError('Failed to load ideas. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewIdeas = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      await ideasAPI.generatePool()
      
      const response = await ideasAPI.getGameSession(15)
      if (response.ideas && response.ideas.length > 0) {
        setIdeas(response.ideas)
        setCurrentIndex(0)
      } else {
        setError('No ideas available. Please try again later.')
      }
    } catch (error) {
      console.error('Error generating ideas:', error)
      setError('Failed to generate new ideas. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSwipe = async (direction) => {
    if (!currentIdea || !currentIdea.id) return

    const isLike = direction === 'right'

    // Анимация улета карточки
    const exitX = isLike ? 1000 : -1000
    const exitRotate = isLike ? 30 : -30
    
    // Запускаем анимацию улета
    x.set(exitX)
    scale.set(0.9)
    
    // Даем время для анимации (ускорено)
    setTimeout(async () => {
      try {
        // Отправляем свайп на сервер
        await swipesAPI.createSwipe({
          idea_id: currentIdea.id,
          swipe: isLike
        })

        // Обновляем локальное состояние
        if (isLike) {
          const newLikedIdeas = [...likedIdeas, currentIdea]
          setLikedIdeas(newLikedIdeas)
          localStorage.setItem('likedIdeas', JSON.stringify(newLikedIdeas))
          setSessionStats(prev => ({ ...prev, liked: prev.liked + 1 }))
        } else {
          setSessionStats(prev => ({ ...prev, disliked: prev.disliked + 1 }))
        }

        // Увеличиваем счетчик свайпов
        const newTotalSwiped = totalSwiped + 1
        setTotalSwiped(newTotalSwiped)

        // Переходим к следующей идее и сбрасываем анимацию
        setCurrentIndex(prev => prev + 1)
        x.set(0)
        scale.set(1)

        // Проверяем прогресс после обновления состояния
        setTimeout(() => {
          if (newTotalSwiped > 0 && newTotalSwiped % 10 === 0) {
            const currentLikedCount = likedIdeas.length + (isLike ? 1 : 0)
            if (currentLikedCount >= 5) {
              setShowProgressModal(true)
            } else {
              setShowInsufficientLikesModal(true)
            }
          }
        }, 100)

        // Если идеи заканчиваются, загружаем еще
        if (currentIndex >= ideas.length - 3) {
          try {
            await generateNewIdeas()
          } catch (error) {
            console.error('Error loading more ideas:', error)
          }
        }

      } catch (error) {
        console.error('Error creating swipe:', error)
        setError('Failed to save swipe. Please try again.')
        // Возвращаем карточку назад при ошибке
        x.set(0)
        scale.set(1)
      }
    }, 150) // Ускорено с 300ms до 150ms
  }

  // Gesture handlers
  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    if (!currentIdea) return

    const trigger = Math.abs(mx) > 100 || Math.abs(vx) > 0.5

    if (active) {
      x.set(mx)
      scale.set(active ? 1.05 : 1)
    } else if (trigger) {
      const direction = xDir > 0 ? 'right' : 'left'
      // Не устанавливаем x.set здесь, пусть handleSwipe сам управляет анимацией
      handleSwipe(direction)
    } else {
      x.set(0)
      scale.set(1)
    }
  })

  const handleProgressChoice = (choice) => {
    setShowProgressModal(false)
    
    if (choice === 'continue') {
      // Продолжаем свайпать
      return
    } else if (choice === 'proceed') {
      // Проверяем количество понравившихся идей
      if (likedIdeas.length >= 3) {
        navigate('/top-ideas')
      } else {
        setShowInsufficientLikesModal(true)
      }
    }
  }

  const handleBackToHome = () => {
    navigate('/')
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700">Loading ideas...</p>
        </div>
      </div>
    )
  }

  // Error state
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={generateNewIdeas}
              disabled={isGenerating}
              className="btn-primary flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Try Again'
              )}
            </button>
            <button
              onClick={handleBackToHome}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // No more ideas
  if (!currentIdea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="card p-8 text-center max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Great job!</h2>
          <p className="text-gray-700 mb-2">
            You've swiped through all available ideas!
          </p>
          <p className="text-gray-700 mb-6">
            Liked: {sessionStats.liked} | Disliked: {sessionStats.disliked}
          </p>
          <div className="flex gap-4">
            {likedIdeas.length >= 3 ? (
              <button
                onClick={() => navigate('/top-ideas')}
                className="btn-primary flex-1"
              >
                Choose Top 3 Ideas
              </button>
            ) : (
              <button
                onClick={generateNewIdeas}
                disabled={isGenerating}
                className="btn-primary flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Generate More Ideas'
                )}
              </button>
            )}
            <button
              onClick={handleBackToHome}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Progress Modal */}
      {showProgressModal && (
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
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Great Progress!</h2>
            <p className="text-gray-700 mb-2">
              You've swiped {totalSwiped} ideas and liked {likedIdeas.length}!
            </p>
            <p className="text-gray-700 mb-6">
              What would you like to do next?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleProgressChoice('continue')}
                className="btn-secondary flex-1"
              >
                Keep Swiping
              </button>
              <button
                onClick={() => handleProgressChoice('proceed')}
                className="btn-primary flex-1"
                disabled={likedIdeas.length < 3}
              >
                Choose Top 3
              </button>
            </div>
            {likedIdeas.length < 3 && (
              <p className="text-orange-600 text-xs mt-3 font-medium">
                Need {3 - likedIdeas.length} more liked ideas to proceed
              </p>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Insufficient Likes Modal */}
      {showInsufficientLikesModal && (
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Keep Going!</h2>
            <p className="text-gray-700 mb-2">
              You've swiped {totalSwiped} ideas but only liked {likedIdeas.length}.
            </p>
            <p className="text-gray-700 mb-6">
              You need at least 5 liked ideas to proceed to selection. Keep swiping to find more ideas you love!
            </p>
            <button
              onClick={() => setShowInsufficientLikesModal(false)}
              className="btn-primary w-full"
            >
              Continue Swiping
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
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Discover Ideas</h1>
              <p className="text-blue-700 text-sm">Swipe right to like, left to pass</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <p className="text-blue-700 text-sm">
              Swiped: {totalSwiped} | Liked: {likedIdeas.length}
            </p>
            <p className="text-blue-600 text-xs">
              Progress: {totalSwiped % 10}/10 until next checkpoint
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          {/* Card Stack */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Current Card */}
            <motion.div
              {...bind()}
              style={{
                x,
                scale,
                rotate,
                opacity,
              }}
              className="card p-8 cursor-grab active:cursor-grabbing touch-none select-none"
              whileHover={{ scale: 1.02 }}
            >
              {/* Domain Icon */}
              <div className={`w-20 h-20 bg-gradient-to-r ${getDomainColor(currentIdea.domain || 'General')} rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl`}>
                {getDomainIcon(currentIdea.domain || 'General')}
              </div>

              {/* Domain */}
              <div className="text-center text-blue-600 text-sm mb-4">
                {currentIdea.domain || 'General'}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">
                {currentIdea.title}
              </h2>

              {/* Description */}
              <p className="text-blue-700 text-center mb-8 leading-relaxed">
                {currentIdea.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {(currentIdea.tags || []).slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Next Card Preview */}
            {ideas[currentIndex + 1] && (
              <motion.div
                className="card p-8 absolute top-2 left-2 right-2 -z-10 opacity-50 scale-95"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getDomainColor(ideas[currentIndex + 1].domain)} rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                    {getDomainIcon(ideas[currentIndex + 1].domain)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">
                    {ideas[currentIndex + 1].title}
                  </h3>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex justify-center space-x-8 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => handleSwipe('left')}
              disabled={!currentIdea}
              className="w-16 h-16 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={() => handleSwipe('right')}
              disabled={!currentIdea}
              className="w-16 h-16 bg-green-500/20 hover:bg-green-500/40 rounded-full flex items-center justify-center text-green-400 hover:text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="w-8 h-8" />
            </button>
          </motion.div>

          {/* Instructions */}
          <motion.p 
            className="text-center text-gray-600 text-sm mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Drag the card or use buttons • Right = Like • Left = Pass
          </motion.p>
        </div>
      </div>
    </div>
  )
}

export default SwipePage 