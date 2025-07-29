import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Logo = ({ className = "" }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/')
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`flex items-center space-x-2 cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
        <Star className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-white">SmartSwipe</span>
    </motion.button>
  )
}

export default Logo 