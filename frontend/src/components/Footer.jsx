import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const Footer = () => {
  return (
    <motion.footer 
      className="bg-black/20 backdrop-blur-md border-t border-white/10 py-6 mt-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <motion.div 
            className="flex items-center space-x-2 text-white/80"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm">Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm">by</span>
            <span className="text-sm font-semibold text-white">Abylay Slamzhanov</span>
            <span className="text-sm">2025</span>
          </motion.div>
          
          <div className="text-xs text-white/60">
            AI-Powered Startup Discovery Platform
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

export default Footer 