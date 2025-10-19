import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const Footer = () => {
  return (
    <motion.footer 
      className="bg-white border-t border-blue-100 py-6 mt-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <motion.div 
            className="flex items-center space-x-2 text-blue-800"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm">Made with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm">by</span>
            <span className="text-sm font-semibold text-blue-900">Abylay Slamzhanov</span>
            <span className="text-sm">2025</span>
          </motion.div>
          
          <div className="text-xs text-blue-600">
            AI-Powered Startup Discovery Platform
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

export default Footer 