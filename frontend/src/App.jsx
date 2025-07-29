import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import StarField from './components/StarField'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import SwipePage from './pages/SwipePage'
import ResultsPage from './pages/ResultsPage'
import QuestionnairePage from './pages/QuestionnairePage'
import FinalIdeaPage from './pages/FinalIdeaPage'
import ProfilePage from './pages/ProfilePage'
import ProfileDomainsPage from './pages/ProfileDomainsPage'
import TopIdeasPage from './pages/TopIdeasPage'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        <StarField />
        <Navbar />
        
        <div className="flex-1 flex flex-col pt-20">
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/swipe" element={
                <ProtectedRoute>
                  <SwipePage />
                </ProtectedRoute>
              } />
              <Route path="/results" element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } />
              <Route path="/top-ideas" element={
                <ProtectedRoute>
                  <TopIdeasPage />
                </ProtectedRoute>
              } />
              <Route path="/questionnaire" element={
                <ProtectedRoute>
                  <QuestionnairePage />
                </ProtectedRoute>
              } />
              <Route path="/final-idea" element={
                <ProtectedRoute>
                  <FinalIdeaPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/profile/domains" element={
                <ProtectedRoute>
                  <ProfileDomainsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </div>
    </Router>
  )
}

export default App
