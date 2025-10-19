import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, CheckCircle, Sparkles, Plus } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authAPI } from '../lib/api'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const { user, updateDomains, isAuthenticated, checkAuth } = useAuthStore()
  const [selectedDomains, setSelectedDomains] = useState([])
  const [availableDomains, setAvailableDomains] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customDomainName, setCustomDomainName] = useState('')

  // Расширенный список доменов (8 вместо 7)
  const allDomains = [
    {
      id: 'fintech',
      name: 'FinTech',
      description: 'Финансовые технологии, банкинг, платежи',
      icon: '💳',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'healthtech',
      name: 'HealthTech',
      description: 'Медицинские технологии, здравоохранение',
      icon: '🏥',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'edtech',
      name: 'EdTech',
      description: 'Образовательные технологии, онлайн-обучение',
      icon: '🎓',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      description: 'Электронная коммерция, онлайн-ретейл',
      icon: '🛒',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      id: 'gaming',
      name: 'Gaming',
      description: 'Игровая индустрия, мобильные игры',
      icon: '🎮',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      id: 'saas',
      name: 'SaaS',
      description: 'Программное обеспечение как услуга',
      icon: '☁️',
      color: 'from-teal-500 to-blue-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20'
    },
    {
      id: 'ai-ml',
      name: 'AI/ML',
      description: 'Искусственный интеллект и машинное обучение',
      icon: '🤖',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    },
    {
      id: 'sustainability',
      name: 'Sustainability',
      description: 'Устойчивое развитие, экологические технологии',
      icon: '🌱',
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ]

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Проверяем аутентификацию
        const isAuth = await checkAuth()
        
        if (!isAuth) {
          navigate('/login')
          return
        }
        
        // Если пользователь уже завершил онбординг, перенаправляем его
        if (user?.onboarding_completed) {
          navigate('/swipe')
          return
        }
        
        // Загружаем доступные домены из backend
        const response = await authAPI.getAvailableDomains()
        setAvailableDomains(response.domains || allDomains.map(d => d.id))
        
      } catch (error) {
        console.error('Error initializing page:', error)
        setError('Failed to load available domains')
        
        // Fallback на все домены
        setAvailableDomains(allDomains.map(d => d.id))
      } finally {
        setIsLoading(false)
      }
    }

    initializePage()
  }, [navigate, checkAuth, user?.onboarding_completed])

  const handleDomainToggle = (domainId) => {
    setSelectedDomains(prev => {
      if (prev.includes(domainId)) {
        return prev.filter(id => id !== domainId)
      } else {
        return [...prev, domainId]
      }
    })
  }

  const handleAddCustomDomain = () => {
    if (!customDomainName.trim()) return
    
    const customId = `custom:${customDomainName.trim()}`
    
    // Проверяем, что кастомный домен еще не добавлен
    if (selectedDomains.includes(customId)) {
      setError('This custom domain is already selected')
      return
    }
    
    // Добавляем кастомный домен
    setSelectedDomains(prev => [...prev, customId])
    setCustomDomainName('')
    setShowCustomForm(false)
    setError(null)
  }

  const handleContinue = async () => {
    if (selectedDomains.length === 0) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      // Отправляем ID доменов в backend (включая кастомные с префиксом "custom:")
      const result = await updateDomains(selectedDomains)
      
      if (result.success) {
        navigate('/swipe')
      } else {
        setError(result.error || 'Failed to update domains')
      }
    } catch (error) {
      console.error('Error updating domains:', error)
      setError('Failed to update domains. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCustomDomainName = (domainId) => {
    if (domainId.startsWith('custom:')) {
      return domainId.replace('custom:', '')
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
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
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Choose Your Interests</h1>
          <p className="text-blue-700">Select domains that interest you most</p>
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
          {/* Error Message */}
          {error && (
            <motion.div 
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Progress */}
          <div className="text-center mb-12">
            <div className="w-full bg-blue-50 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-sky-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedDomains.length / 8) * 100}%` }}
              />
            </div>
            <p className="text-blue-700">
              Selected: {selectedDomains.length} of 8 domains (minimum 1 required)
            </p>
          </div>

          {/* Available Domains */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-6">
              Choose Your Domains ({allDomains.length} available)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allDomains.map((domain, index) => (
                <motion.div
                  key={domain.id}
                  className={`card cursor-pointer transition-all duration-300 ${
                    selectedDomains.includes(domain.id) 
                      ? 'ring-2 ring-blue-400 bg-blue-50' 
                      : 'hover:ring-1 hover:ring-blue-200'
                  }`}
                  onClick={() => handleDomainToggle(domain.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${domain.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                      {domain.icon}
                    </div>
                    
                    <h3 className="text-lg font-bold text-blue-900 mb-2">{domain.name}</h3>
                    <p className="text-blue-700 text-sm mb-4">{domain.description}</p>
                    
                    {selectedDomains.includes(domain.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="w-6 h-6 text-blue-600 mx-auto" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Custom Domains Section */}
          {selectedDomains.length < 8 && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
                <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                Or Create Your Own Domain
              </h3>
              
              {!showCustomForm ? (
                <div className="card p-6 text-center">
                  <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Add Your Own Domain</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Create a custom domain that reflects your unique interests
                  </p>
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="btn-secondary px-6 py-2 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Custom Domain</span>
                  </button>
                </div>
              ) : (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Create Custom Domain</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={customDomainName}
                      onChange={(e) => setCustomDomainName(e.target.value)}
                      placeholder="Enter domain name (e.g., Crypto, Robotics, Travel)"
                      className="flex-1 px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                    <button
                      onClick={handleAddCustomDomain}
                      disabled={!customDomainName.trim()}
                      className="btn-primary px-6 py-2 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomForm(false)
                        setCustomDomainName('')
                      }}
                      className="btn-secondary px-6 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    Domain name must be 2-50 characters
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Selected Custom Domains */}
          {selectedDomains.some(id => id.startsWith('custom:')) && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                Your Custom Domains
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedDomains
                  .filter(id => id.startsWith('custom:'))
                  .map((customId, index) => {
                    const name = getCustomDomainName(customId)
                    return (
                      <motion.div
                        key={customId}
                        className="card bg-yellow-500/10 border border-yellow-500/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 + index * 0.1 }}
                      >
                        <div className="text-center">
                          <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-blue-900 mb-2">{name}</h3>
                          <p className="text-blue-600 text-xs mb-4">Custom Domain</p>
                          
                          <button
                            onClick={() => handleDomainToggle(customId)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <button
              onClick={handleContinue}
              disabled={selectedDomains.length === 0 || isSubmitting}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Continue with {selectedDomains.length} domains</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            {selectedDomains.length === 0 && (
              <p className="text-blue-700 text-sm mt-4">
                Please select at least one domain to continue
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default OnboardingPage 