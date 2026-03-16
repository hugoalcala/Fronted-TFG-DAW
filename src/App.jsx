import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from './hooks/useTheme'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Teachers from './pages/Teachers'
import TeacherProfile from './pages/TeacherProfile'
import Messages from './pages/Messages'
import AdminDashboard from './pages/AdminDashboard'

// Google Client ID desde variables de entorno
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn('⚠️ VITE_GOOGLE_CLIENT_ID no está configurado en .env.local')
}

// Componente para manejar el callback de Google
function GoogleCallbackHandler() {
  useEffect(() => {
    console.log('✅ GoogleCallback component mounted')
    
    const handleCallback = async () => {
      try {
        // Capturar código de Google de la URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        console.log('📍 Code from URL:', code)
        
        if (!code) {
          console.log('⚠️ No authorization code received from Google')
          window.location.href = '/login'
          return
        }

        // Obtener el tipo de operación (login o register) desde sessionStorage
        const authType = sessionStorage.getItem('googleAuthType') || 'login'
        console.log('🔐 Auth Type:', authType)

        console.log('🔄 Sending code and type to backend...')
        
        // Enviar código Y tipo al backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code, 
            type: authType  // ✅ Enviar el tipo de operación
          }),
        })

        const data = await response.json()
        console.log('📨 Response status:', response.status)
        console.log('✅ Response data:', data)

        if (response.ok && data.token) {
          // ✅ Autenticación exitosa
          console.log('🎫 Token received, saving...')
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          console.log('💾 Token saved to localStorage')
          
          // Obtener el tipo de operación
          const authType = sessionStorage.getItem('googleAuthType') || 'login'
          sessionStorage.removeItem('googleAuthType')
          
          // Si es registro con Google → /login
          // Si es login con Google → verificar rol
          if (authType === 'register') {
            console.log('📝 Google Register exitoso. Redirigiendo a /login para iniciar sesión')
            window.location.href = '/login'
          } else {
            // Login con Google: redirigir según rol
            if (data.user?.role === 'admin') {
              console.log('👑 Admin detectado. Redirigiendo a /admin')
              window.location.href = '/admin'
            } else {
              console.log('✅ Google Login exitoso. Redirigiendo a /dashboard')
              window.location.href = '/dashboard'
            }
          }
        } else {
          // ❌ Error específico según el tipo de operación
          console.error('❌ Authentication failed:', data.error)
          
          if (data.error === 'user_not_found') {
            // Google Login pero usuario no existe
            console.log('📝 User not found. Redirecting to /register')
            alert('Usuario no encontrado. Por favor registrate primero.')
            sessionStorage.removeItem('googleAuthType')
            window.location.href = '/registro'
          } else if (data.error === 'user_exists') {
            // Google Register pero usuario ya existe
            console.log('⚠️ User already exists. Redirecting to /login')
            alert('Usuario ya registrado. Por favor inicia sesión.')
            sessionStorage.removeItem('googleAuthType')
            window.location.href = '/login'
          } else {
            console.log('❌ Authentication failed: ' + (data.message || 'Unknown error'))
            alert('Falló la autenticación: ' + (data.message || 'Error desconocido'))
            sessionStorage.removeItem('googleAuthType')
            window.location.href = '/login'
          }
        }
      } catch (error) {
        console.error('❌ GoogleCallback error:', error)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        sessionStorage.removeItem('googleAuthType')
        alert('Ocurrió un error durante la autenticación')
        window.location.href = '/login'
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Procesando autenticación con Google...</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">Abre la consola (F12) para ver los logs</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers/:id"
                element={
                  <ProtectedRoute>
                    <TeacherProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="/auth/google/callback" element={<GoogleCallbackHandler />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
