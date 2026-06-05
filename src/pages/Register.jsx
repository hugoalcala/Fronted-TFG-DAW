import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import logo from '../assets/educonnect_logo.png'

function Register() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { register } = useAuth()
  
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    console.log('🔄 Formulario registro enviado:', { nombre, apellido, email })
    setLoading(true)

    try {
      const fullName = `${nombre} ${apellido}`.trim()
      console.log('📝 Nombre completo:', fullName)
      
      const result = await register(fullName, email, password, confirmPassword)
      console.log('✅ Registro exitoso:', result)
      
      // Mostrar mensaje de éxito
      setError('')
      // Limpiar formulario
      setNombre('')
      setApellido('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      
      // Navegar a login después de un pequeño delay
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (err) {
      console.error('❌ Error en registro:', err.message)
      setError(err.message || 'Error al registrarse. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    
    try {
      // Marcar como tipo de autenticación (para logs)
      sessionStorage.setItem('googleAuthType', 'register')
      
      // El backend verifica si el usuario existe en la BD
      // Si existe → error (debe usar login)
      // Si no existe → crea la cuenta automáticamente
      const { google_auth_url } = await authService.getGoogleAuthUrl()
      
      // Redirigir a Google para autenticación
      window.location.href = google_auth_url
    } catch (err) {
      setError(err.message || 'Error al conectar con Google. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const googleLogin = handleGoogleSuccess

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src={logo}
              alt="EduConnect"
              className="h-10 w-auto"
            />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Register Form */}
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-900 dark:text-white mb-2">
                Crear Cuenta
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Únete a la comunidad educativa
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-100 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Apellido */}
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Tu apellido"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@educonnect.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg mt-6 disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </button>

              {/* Google Register Button */}
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    O regístrate con
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-900 dark:text-blue-400 font-semibold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
