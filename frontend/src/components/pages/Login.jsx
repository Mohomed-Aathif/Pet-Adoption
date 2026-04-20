import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff, ArrowRight, Home } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [localError, setLocalError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setLocalError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields')
      return
    }

    try {
      const userData = await login(formData.email, formData.password)
      
      // Route to appropriate dashboard based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (userData.role === 'owner') {
        navigate('/dashboard', { replace: true })
      } else if (userData.role === 'adopter') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const displayError = localError || error

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background with Layered Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Glow Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml?utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><defs><pattern id=%22grid%22 width=%22100%22 height=%22100%22 patternUnits=%22userSpaceOnUse%22><path d=%22M 100 0 L 0 0 0 100%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.02)%22 stroke-width=%221%22/></pattern></defs><rect width=%22100%22 height=%22100%22 fill=%22url(%23grid)%22/></svg>')] opacity-30" />

      {/* Main Container */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header with Animation */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl">
                  <span className="text-3xl">🐾</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
              Pet Adoption
            </h1>
            <p className="text-gray-300 text-lg">Welcome back! Let's find your perfect companion</p>
          </div>

          {/* Glassmorphism Card */}
          <div className="relative group">
            {/* Card Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Main Card */}
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 shadow-2xl">
              {/* Error Message with Animation */}
              {displayError && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl flex gap-3 animate-slide-down">
                  <AlertCircle className="text-red-400 flex-shrink-0 w-5 h-5 mt-0.5" />
                  <p className="text-red-300 text-sm font-medium">{displayError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="group/field">
                  <label htmlFor="login-email" className="block text-sm font-semibold text-gray-200 mb-2.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'email' ? 'text-indigo-400' : 'text-gray-400'}`} />
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group/field">
                  <div className="flex items-center justify-between mb-2.5">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-gray-200">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors duration-300 font-medium"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'password' ? 'text-indigo-400' : 'text-gray-400'}`} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-300 disabled:opacity-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg hover:shadow-indigo-500/50 hover:shadow-2xl transform hover:scale-105 disabled:scale-100 disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white/5 text-gray-400 text-sm font-medium">New here?</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Create Account Button */}
                <Link
                  to="/register"
                  className="block w-full text-center bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  Create Account
                </Link>

                {/* Go to Home Button */}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600/30 to-gray-700/30 hover:from-gray-600/50 hover:to-gray-700/50 border border-white/10 text-gray-300 hover:text-white font-semibold py-3.5 rounded-xl transition-all duration-300 backdrop-blur-sm"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-gray-400 text-xs mt-8">
            By signing in, you agree to our <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms</Link> and <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
