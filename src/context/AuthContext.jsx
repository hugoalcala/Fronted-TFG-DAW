import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser()
          setUser(storedUser)
          setIsAuthenticated(true)

          // Opcional: Validar el token con el backend
          try {
            const currentUser = await authService.getCurrentUser()
            setUser(currentUser)
          } catch (err) {
            console.warn('Token inválido, limpiando sesión')
            authService.clearSession()
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      } catch (err) {
        console.error('Error al verificar autenticación:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await authService.login(email, password)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password, passwordConfirmation) => {
    setLoading(true)
    try {
      const response = await authService.register(name, email, password, passwordConfirmation)
      // ⚠️ NO autenticar automáticamente después del registro
      // El usuario debe iniciar sesión manualmente
      console.log('✅ Registro completado, usuario debe iniciar sesión')
      return response
    } finally {
      setLoading(false)
    }
  }

  const googleCallback = async (code) => {
    setLoading(true)
    try {
      const response = await authService.googleCallback(code)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      console.log('✅ Usuario actualizado a rol:', newRole)
    }
  }

  const refreshUser = async () => {
    setLoading(true)
    try {
      console.log('🔄 Refrescando usuario desde el backend...')
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      localStorage.setItem('user', JSON.stringify(currentUser))
      console.log('✅ Usuario actualizado:', currentUser)
      return currentUser
    } catch (error) {
      console.error('❌ Error al refrescar usuario:', error)
      // Si el token es inválido, cerrar sesión
      if (error.message === 'Sesión expirada') {
        setUser(null)
        setIsAuthenticated(false)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    login,
    register,
    googleCallback,
    logout,
    updateUserRole,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
