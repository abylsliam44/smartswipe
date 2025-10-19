import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { authAPI } from '../lib/api'
import useAuthStore from '../store/authStore'

const ProfileDomainsPage = () => {
  const navigate = useNavigate()
  const { user, checkAuth } = useAuthStore()
  const [selectedDomains, setSelectedDomains] = useState([])
  const [availableDomains, setAvailableDomains] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customDomainName, setCustomDomainName] = useState('')

  const getDomainIcon = (domainId, isCustom = false) => {
    if (isCustom) return '✨'
    
    const icons = {
      'fintech': '💳',
      'healthtech': '🏥',
      'edtech': '🎓',
      'ecommerce': '🛒',
      'gaming': '🎮',
      'saas': '☁️',
      'ai-ml': '🤖',
      'sustainability': '🌱'
    }
    return icons[domainId] || '💡'
  }

  const getDomainColor = (domainId, isCustom = false) => {
    if (isCustom) return 'from-yellow-500 to-orange-500'
    
    const colors = {
      'fintech': 'from-blue-500 to-cyan-500',
      'healthtech': 'from-green-500 to-emerald-500',
      'edtech': 'from-purple-500 to-pink-500',
      'ecommerce': 'from-orange-500 to-red-500',
      'gaming': 'from-indigo-500 to-purple-500',
      'saas': 'from-teal-500 to-blue-500',
      'ai-ml': 'from-pink-500 to-rose-500',
      'sustainability': 'from-emerald-500 to-green-500'
    }
    return colors[domainId] || 'from-gray-500 to-gray-600'
  }

  useEffect(() => {
    loadProfileDomains()
  }, [])

  const loadProfileDomains = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await authAPI.getProfileDomains()
      setSelectedDomains(response.selected_domains || [])
      setAvailableDomains(response.available_domains || [])
    } catch (error) {
      console.error('Error loading profile domains:', error)
      setError('Failed to load domains')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDomain = async (domainId) => {
    try {
      setIsUpdating(true)
      setError(null)
      
      await authAPI.addDomain(domainId)
      
      // Обновляем состояние локально
      const domainToMove = availableDomains.find(d => d.id === domainId)
      if (domainToMove) {
        setSelectedDomains(prev => [...prev, { ...domainToMove, is_custom: false }])
        setAvailableDomains(prev => prev.filter(d => d.id !== domainId))
      }
      
      // Обновляем данные пользователя
      await checkAuth()
    } catch (error) {
      console.error('Error adding domain:', error)
      setError('Failed to add domain')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddCustomDomain = async () => {
    if (!customDomainName.trim()) return

    try {
      setIsUpdating(true)
      setError(null)
      
      await authAPI.addCustomDomain(customDomainName.trim())
      
      // Добавляем кастомный домен в состояние
      const customDomain = {
        id: `custom:${customDomainName.trim()}`,
        name: customDomainName.trim(),
        description: 'Custom domain',
        is_custom: true
      }
      
      setSelectedDomains(prev => [...prev, customDomain])
      setCustomDomainName('')
      setShowCustomForm(false)
      
      // Обновляем данные пользователя
      await checkAuth()
    } catch (error) {
      console.error('Error adding custom domain:', error)
      setError(error.response?.data?.detail || 'Failed to add custom domain')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveDomain = async (domainId) => {
    try {
      setIsUpdating(true)
      setError(null)
      
      await authAPI.removeDomain(domainId)
      
      // Обновляем состояние локально
      const domainToRemove = selectedDomains.find(d => d.id === domainId)
      if (domainToRemove && !domainToRemove.is_custom) {
        // Если это стандартный домен, возвращаем его в доступные
        setAvailableDomains(prev => [...prev, {
          id: domainToRemove.id,
          name: domainToRemove.name,
          description: domainToRemove.description
        }])
      }
      
      setSelectedDomains(prev => prev.filter(d => d.id !== domainId))
      
      // Обновляем данные пользователя
      await checkAuth()
    } catch (error) {
      console.error('Error removing domain:', error)
      setError(error.response?.data?.detail || 'Failed to remove domain')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading domains...</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="text-blue-700 hover:text-blue-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Manage Domains</h1>
              <p className="text-blue-700">Add or remove your interests</p>
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

          {/* Selected Domains */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
              Your Selected Domains ({selectedDomains.length}/8)
            </h2>
            
            {selectedDomains.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-blue-700">No domains selected yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedDomains.map((domain, index) => (
                  <motion.div
                    key={domain.id}
                    className={`card relative group`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getDomainColor(domain.id, domain.is_custom)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl relative`}>
                        {getDomainIcon(domain.id, domain.is_custom)}
                        {domain.is_custom && (
                          <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-blue-900 mb-2">
                        {domain.name}
                        {domain.is_custom && (
                          <span className="text-xs text-blue-600 block">Custom</span>
                        )}
                      </h3>
                      <p className="text-blue-700 text-sm mb-4">{domain.description}</p>
                      
                      {/* Remove button */}
                      {selectedDomains.length > 1 && (
                        <button
                          onClick={() => handleRemoveDomain(domain.id)}
                          disabled={isUpdating}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Add Custom Domain */}
          {selectedDomains.length < 8 && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
                Create Custom Domain
              </h2>
              
              {!showCustomForm ? (
                <div className="card p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                    ✨
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Add Your Own Domain</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Create a custom domain that reflects your unique interests
                  </p>
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="btn-primary px-6 py-2"
                  >
                    Create Custom Domain
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
                      disabled={isUpdating}
                    />
                    <button
                      onClick={handleAddCustomDomain}
                      disabled={!customDomainName.trim() || isUpdating}
                      className="btn-primary px-6 py-2 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomForm(false)
                        setCustomDomainName('')
                      }}
                      className="btn-secondary px-6 py-2"
                      disabled={isUpdating}
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

          {/* Available Domains */}
          {availableDomains.length > 0 && selectedDomains.length < 8 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                <Plus className="w-6 h-6 text-blue-600 mr-3" />
                Available Predefined Domains ({availableDomains.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableDomains.map((domain, index) => (
                  <motion.div
                    key={domain.id}
                    className="card cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddDomain(domain.id)}
                  >
                    <div className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getDomainColor(domain.id)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                        {getDomainIcon(domain.id)}
                      </div>
                      
                      <h3 className="text-lg font-bold text-blue-900 mb-2">{domain.name}</h3>
                      <p className="text-blue-700 text-sm mb-4">{domain.description}</p>
                      
                      {/* Add button */}
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 bg-green-500/20 group-hover:bg-green-500/40 rounded-full flex items-center justify-center text-green-400 transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Info */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="card p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-blue-900 mb-3">Domain Management</h3>
              <p className="text-blue-700 text-sm mb-4">
                Your selected domains determine what types of startup ideas you'll see when swiping. 
                You can have between 1-8 domains selected at any time, including custom domains.
              </p>
              <p className="text-blue-600 text-xs">
                Changes take effect immediately and will influence your next swipe session.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfileDomainsPage 