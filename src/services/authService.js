const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const authService = {
  // === ENDPOINTS PÚBLICOS ===

  /**
   * POST /register
   * Body: { name, email, password, password_confirmation }
   * Response: { message, user, token }
   */
  async register(name, email, password, passwordConfirmation) {
    console.log('📝 Enviando registro:', { name, email })
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    })

    console.log('📨 Respuesta status:', response.status)
    
    const data = await response.json()
    console.log('📦 Datos recibidos:', data)
    
    if (!response.ok) {
      console.error('❌ Error en registro:', data)
      throw new Error(data.message || 'Error en el registro')
    }

    // ⚠️ NO guardar token en el registro
    // El usuario debe iniciar sesión manualmente después de registrarse
    console.log('✅ Registro exitoso, usuario debe iniciar sesión')
    return data
  },

  /**
   * POST /login
   * Body: { email, password }
   * Response: { message, user, token }
   */
  async login(email, password) {
    console.log('🔐 Intentando login:', { email })
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      console.log('📨 Respuesta status:', response.status)
      
      const data = await response.json()
      console.log('📦 Datos recibidos:', data)

      if (!response.ok) {
        console.error('❌ Error en login:', data)
        
        // Manejar errores específicos del backend
        if (response.status === 401 || response.status === 422) {
          throw new Error('Email o contraseña incorrectos.')
        } else if (response.status === 404) {
          throw new Error('Usuario no encontrado. Por favor regístrate.')
        } else {
          throw new Error(data.message || 'Error al iniciar sesión.')
        }
      }

      // Guardar token y usuario
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      console.log('✅ Login exitoso')
      return data
    } catch (err) {
      console.error('❌ Error en login:', err.message)
      
      // Detectar error de conexión
      if (err.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión de internet.')
      }
      
      throw err
    }
  },

  /**
   * GET /auth/google
   * Response: { google_auth_url }
   */
  async getGoogleAuthUrl() {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener URL de Google')
    }

    const data = await response.json()
    return data
  },

  /**
   * POST /auth/google/callback
   * Body: { code }
   * Response: { message, user, token }
   */
  async googleCallback(code) {
    const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error en autenticación con Google')
    }

    const data = await response.json()
    // Guardar token
    if (data.token) {
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return data
  },

  // === ENDPOINTS PROTEGIDOS ===

  /**
   * GET /me
   * Header: Authorization: Bearer {token}
   * Response: { id, name, email, ... }
   */
  async getCurrentUser() {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        throw new Error('Sesión expirada')
      }
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener usuario')
    }

    const data = await response.json()
    return data
  },

  /**
   * POST /logout
   * Header: Authorization: Bearer {token}
   * Response: { message }
   */
  async logout() {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok && response.status !== 401) {
        const error = await response.json()
        console.error(error.message || 'Error al cerrar sesión')
      }
    } catch (err) {
      console.error('Error durante logout:', err)
    } finally {
      // Siempre limpiar el localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    }
  },

  // === MÉTODOS AUXILIARES ===

  /**
   * Obtiene el token actual
   */
  getToken() {
    return localStorage.getItem('authToken')
  },

  /**
   * Obtiene el usuario actual del localStorage
   */
  getStoredUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem('authToken')
  },

  /**
   * Limpia la sesión
   */
  clearSession() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  // === RECUPERACIÓN DE CONTRASEÑA ===

  /**
   * POST /forgot-password
   * Body: { email }
   * Response: { message }
   * Verifica si el email existe en la base de datos
   */
  async verifyEmailExists(email) {
    console.log('🔍 Verificando si el email existe:', { email })
    
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    console.log('📨 Respuesta status:', response.status)
    
    const data = await response.json()
    console.log('📦 Datos recibidos:', data)
    
    if (!response.ok) {
      console.error('❌ Error verificando email:', data)
      throw new Error(data.message || 'El email no está registrado.')
    }

    console.log('✅ Email verificado')
    return data
  },

  /**
   * POST /reset-password
   * Body: { email, password, password_confirmation }
   * Response: { message, user }
   * Cambia la contraseña del usuario después de verificar el email
   */
  async resetPassword(email, newPassword, passwordConfirmation) {
    console.log('🔄 Resetando contraseña para:', { email })
    
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      }),
    })

    console.log('📨 Respuesta status:', response.status)
    
    const data = await response.json()
    console.log('📦 Datos recibidos:', data)
    
    if (!response.ok) {
      console.error('❌ Error resetando contraseña:', data)
      throw new Error(data.message || 'Error al cambiar la contraseña.')
    }

    console.log('✅ Contraseña cambiada exitosamente')
    return data
  },
}

export default authService
