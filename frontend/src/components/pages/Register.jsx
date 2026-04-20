import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Loader, CheckCircle, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading, error } = useAuth()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'adopter',
  })
  const [localError, setLocalError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setLocalError(null)
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setLocalError('Please enter your full name')
      return false
    }
    if (!formData.email.trim()) {
      setLocalError('Please enter your email')
      return false
    }
    if (!formData.password || formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await register(formData)
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const displayError = localError || error
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordMismatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword

  let submitContent = 'Create Account'
  if (loading) {
    submitContent = (
      <>
        <Loader className="w-5 h-5 animate-spin" />
        Creating Account...
      </>
    )
  } else if (success) {
    submitContent = (
      <>
        <CheckCircle className="w-5 h-5" />
        Account Created!
      </>
    )
  }

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
        <div className="w-full max-w-2xl">
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
              Create Your Account
            </h1>
            <p className="text-gray-300 text-lg">Start your pet adoption journey today</p>
          </div>

          {/* Glassmorphism Card */}
          <div className="relative group">
            {/* Card Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Main Card */}
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 md:p-10 shadow-2xl">
              {/* Success Message with Animation */}
              {success && (
                <div className="mb-6 p-4 bg-green-500/10 backdrop-blur-md border border-green-500/30 rounded-xl flex gap-3 animate-slide-down">
                  <CheckCircle className="text-green-400 flex-shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-green-300 text-sm font-semibold">Registration successful!</p>
                    <p className="text-green-300/70 text-sm">Redirecting to login...</p>
                  </div>
                </div>
              )}

              {/* Error Message with Animation */}
              {displayError && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl flex gap-3 animate-slide-down">
                  <AlertCircle className="text-red-400 flex-shrink-0 w-5 h-5 mt-0.5" />
                  <p className="text-red-300 text-sm font-medium">{displayError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name & Email - 2 Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name Field */}
                  <div className="group/field">
                    <label htmlFor="register-full-name" className="block text-sm font-semibold text-gray-200 mb-2.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'fullName' ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <input
                        id="register-full-name"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput('fullName')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                        disabled={loading || success}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="group/field">
                    <label htmlFor="register-email" className="block text-sm font-semibold text-gray-200 mb-2.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'email' ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <input
                        id="register-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                        disabled={loading || success}
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection - Full Width */}
                <div className="group/field">
                  <label htmlFor="register-role" className="block text-sm font-semibold text-gray-200 mb-2.5">
                    I am a...
                  </label>
                  <div className="relative">
                    <select
                      id="register-role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      onFocus={() => setFocusedInput('role')}
                      onBlur={() => setFocusedInput(null)}
                      className="w-full pl-4 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 appearance-none cursor-pointer"
                      disabled={loading || success}
                    >
                      <option value="adopter" className="bg-slate-900">Pet Adopter</option>
                      <option value="owner" className="bg-slate-900">Pet Owner</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password - 2 Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password Field */}
                  <div className="group/field">
                    <label htmlFor="register-password" className="block text-sm font-semibold text-gray-200 mb-2.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'password' ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                        disabled={loading || success}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-300 disabled:opacity-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading || success}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Minimum 8 characters</p>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="group/field">
                    <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-gray-200 mb-2.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${focusedInput === 'confirmPassword' ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50"
                        disabled={loading || success}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-300 disabled:opacity-50"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        disabled={loading || success}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {formData.confirmPassword && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                          {passwordsMatch ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {passwordsMatch && (
                      <p className="mt-2 text-xs text-green-400">Passwords match</p>
                    )}
                    {passwordMismatch && (
                      <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg hover:shadow-indigo-500/50 hover:shadow-2xl transform hover:scale-105 disabled:scale-100 disabled:hover:shadow-lg mt-8"
                >
                  {loading || success ? (
                    submitContent
                  ) : (
                    <>
                      Create Account
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
                  <span className="px-3 bg-white/5 text-gray-400 text-sm font-medium">Already have an account?</span>
                </div>
              </div>

              {/* Sign In Button */}
              <Link
                to="/login"
                className="block w-full text-center bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-gray-400 text-xs mt-8">
            By creating an account, you agree to our <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms</Link> and <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>
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
