import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const QuestionnairePage = () => {
  const navigate = useNavigate()
  const [selectedIdeas, setSelectedIdeas] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  const questions = [
    {
      id: 'experience',
      question: 'What is your experience level with startups?',
      options: [
        'Complete beginner',
        'Some experience',
        'Experienced entrepreneur',
        'Industry expert'
      ]
    },
    {
      id: 'investment',
      question: 'What is your investment capacity?',
      options: [
        'Bootstrapped (self-funded)',
        'Small investment ($1K-$10K)',
        'Medium investment ($10K-$100K)',
        'Large investment ($100K+)'
      ]
    },
    {
      id: 'timeline',
      question: 'What is your preferred timeline to launch?',
      options: [
        'Immediately (1-3 months)',
        'Short term (3-6 months)',
        'Medium term (6-12 months)',
        'Long term (1+ years)'
      ]
    },
    {
      id: 'team',
      question: 'What is your team situation?',
      options: [
        'Solo founder',
        'Small team (2-5 people)',
        'Medium team (5-20 people)',
        'Large team (20+ people)'
      ]
    },
    {
      id: 'market',
      question: 'What type of market are you targeting?',
      options: [
        'Local/Regional',
        'National',
        'International',
        'Global'
      ]
    }
  ]

  useEffect(() => {
    // Load selected ideas from localStorage
    const savedSelectedIdeas = localStorage.getItem('selectedIdeas')
    if (savedSelectedIdeas) {
      setSelectedIdeas(JSON.parse(savedSelectedIdeas))
    }
  }, [])

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Save answers and navigate to final idea
      localStorage.setItem('questionnaireAnswers', JSON.stringify(answers))
      navigate('/final-idea')
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const currentQ = questions[currentQuestion]
  const hasAnswered = answers[currentQ?.id]

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
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Personalize Your Experience</h1>
          <p className="text-blue-700">Help us understand your preferences better</p>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Progress */}
          <div className="text-center mb-12">
            <div className="w-full bg-blue-50 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-sky-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-blue-700">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          {/* Question */}
          <motion.div 
            className="card p-8 mb-8"
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">
              {currentQ.question}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                    answers[currentQ.id] === option
                      ? 'bg-blue-50 border-2 border-blue-400 text-blue-900'
                      : 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="btn-secondary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {currentQuestion === questions.length - 1 ? 'Generate My Idea' : 'Next'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {!hasAnswered && (
            <p className="text-blue-700 text-sm text-center mt-4">
              Please select an option to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default QuestionnairePage 