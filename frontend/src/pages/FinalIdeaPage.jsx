import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ideasAPI } from '../lib/api'
import { Trophy, Star, Save, RefreshCw, Sparkles, Heart, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

const FinalIdeaPage = () => {
  const navigate = useNavigate()
  const [finalIdea, setFinalIdea] = useState(null)
  const [topIdeas, setTopIdeas] = useState([])
  const [questionnaire, setQuestionnaire] = useState({})
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Загружаем данные из localStorage
    const topIdeasData = localStorage.getItem('topIdeas')
    const questionnaireData = localStorage.getItem('questionnaireAnswers')
    
    if (topIdeasData && questionnaireData) {
      const parsedTopIdeas = JSON.parse(topIdeasData)
      const parsedQuestionnaire = JSON.parse(questionnaireData)
      
      setTopIdeas(parsedTopIdeas)
      setQuestionnaire(parsedQuestionnaire)
      
      // Запрашиваем финальную идею у бэкенда (GPT под капотом)
      fetchFinalIdea(parsedTopIdeas, parsedQuestionnaire)
    } else {
      // Если нет данных, возвращаемся к свайпам
      navigate('/swipe')
    }
  }, [navigate])

  useEffect(() => {
    // Запускаем конфетти при загрузке страницы
    if (finalIdea) {
      setIsLoading(false)
      fireConfetti()
    }
  }, [finalIdea])

  const fireConfetti = () => {
    // Создаем красивое разноцветное конфетти
    const colors = ['#FF6B9D', '#C44AFF', '#4A9EFF', '#4AFFDF', '#A7FF4A', '#FFD54A', '#FF7A4A']
    
    // Первый залп - большой взрыв
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['star', 'circle'],
      gravity: 0.9,
      drift: 0.1,
      ticks: 200
    })

    // Второй залп с задержкой - боковые взрывы
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors,
        shapes: ['square', 'circle'],
        gravity: 0.8
      })
      
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors,
        shapes: ['square', 'circle'],
        gravity: 0.8
      })
    }, 200)

    // Третий залп - звездный дождь
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#9370DB'],
        shapes: ['star'],
        gravity: 0.6,
        scalar: 1.2,
        drift: 0.2
      })
    }, 400)

    // Четвертый залп - финальный взрыв
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.5 },
        colors: colors,
        shapes: ['circle'],
        gravity: 1.2,
        ticks: 300
      })
    }, 600)
  }

  const fetchFinalIdea = async (ideas, answers) => {
    try {
      const data = await ideasAPI.generateFinal(ideas, answers)
      setFinalIdea(data)
    } catch (e) {
      // Фолбэк: локальная генерация, если бэкенд недоступен
      const topIdea = ideas[0]
      const combinedTags = [...new Set(ideas.flatMap(idea => idea.tags || []))]
      setFinalIdea({
        id: 'final-fallback',
        title: `AI-Powered ${topIdea.title.split(' ').slice(-2).join(' ')} Revolution`,
        description: `A personalized solution using ${combinedTags.slice(0, 3).join(', ')}.`,
        domain: topIdea.domain,
        tags: combinedTags.slice(0, 6),
        personalizedFor: answers,
        confidence: 90,
        aiReasoning: 'Local fallback due to API error',
        keyFeatures: [
          `AI-powered ${topIdea.domain.toLowerCase()} analysis`,
          'Personalized UX',
          'Scalable architecture',
          'API integrations'
        ],
        marketPotential: 'High',
        savedAt: new Date().toISOString()
      })
    }
  }

  const handleSaveToProfile = () => {
    // Сохраняем финальную идею в localStorage
    const savedIdeas = JSON.parse(localStorage.getItem('savedIdeas') || '[]')
    savedIdeas.push(finalIdea)
    localStorage.setItem('savedIdeas', JSON.stringify(savedIdeas))
    
    setShowSaveConfirmation(true)
    
    // Дополнительное конфетти при сохранении
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
        shapes: ['circle'],
        gravity: 0.8
      })
    }, 100)
  }

  const handleStartNewCycle = () => {
    // Очищаем временные данные
    localStorage.removeItem('likedIdeas')
    localStorage.removeItem('topIdeas')
    localStorage.removeItem('questionnaire')
    
    // Возвращаемся к свайпам
    navigate('/swipe')
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
    return icons[domain] || '🚀'
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-white/70">AI is crafting your perfect startup idea...</p>
        </div>
      </div>
    )
  }

  if (!finalIdea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-white/70">AI is crafting your perfect startup idea...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-200 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 50,
              opacity: 0 
            }}
            animate={{ 
              y: -50, 
              opacity: [0, 1, 0],
              x: Math.random() * window.innerWidth 
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
          />
        ))}
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Idea Saved!</h2>
            <p className="text-white/70 mb-6">
              Your personalized startup idea has been saved to your profile.
            </p>
            <button
              onClick={() => setShowSaveConfirmation(false)}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Your Perfect Startup Idea</h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-white/70">
            Crafted by AI based on your preferences
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* AI Confidence Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-6 py-3">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                {finalIdea.confidence}% AI Confidence Match
              </span>
              <Zap className="w-5 h-5 text-green-400" />
            </div>
          </div>

          {/* Main Idea Card */}
          <div className="card p-8 mb-8 relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-blue-50" />
            
            <div className="relative z-10">
              {/* Domain Icon */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 bg-gradient-to-r ${getDomainColor(finalIdea.domain)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl`}>
                  {getDomainIcon(finalIdea.domain)}
                </div>
                <div className="text-blue-600 font-medium">
                  {finalIdea.domain}
                </div>
              </div>

              {/* Idea Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-blue-900 text-center mb-6 leading-tight">
                {finalIdea.title}
              </h1>

              {/* Description */}
              <p className="text-xl text-blue-700 text-center mb-8 leading-relaxed max-w-3xl mx-auto">
                {finalIdea.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {finalIdea.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div 
            className="card p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Analysis</h3>
            </div>
            <p className="text-white/80 leading-relaxed">
              {finalIdea.aiReasoning}
            </p>
          </div>

          {/* Key Features */}
          <div 
            className="card p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Key Features</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalIdea.keyFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs">✨</span>
                  </div>
                  <p className="text-white/80 text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleSaveToProfile}
              disabled={showSaveConfirmation}
              className="btn-primary px-8 py-4 text-lg flex items-center space-x-3 justify-center"
            >
              <Save className="w-5 h-5" />
              <span>Save to Profile</span>
              <Heart className="w-5 h-5" />
            </button>

            <button
              onClick={handleStartNewCycle}
              className="btn-secondary px-8 py-4 text-lg flex items-center space-x-3 justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Start New Discovery</span>
            </button>
          </div>

          {/* Fun Stats */}
          <div 
            className="text-center mt-8 card p-6"
          >
            <p className="text-white/60 text-sm mb-2">
              🎯 This idea was crafted from {topIdeas.length} top selections
            </p>
            <p className="text-white/60 text-sm">
              🚀 Market Potential: {finalIdea.marketPotential}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinalIdeaPage 