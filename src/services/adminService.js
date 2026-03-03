// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Obtener token de autenticación
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

/**
 * Headers con autenticación
 */
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  }
}

/**
 * Servicio de administración
 */
const adminService = {
  /**
   * Obtener estadísticas generales del dashboard admin
   * GET /api/admin/stats
   */
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener estadísticas')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getStats:', error)
      throw error
    }
  },

  /**
   * Obtener lista de profesores pendientes de aprobación
   * GET /api/admin/pending-teachers
   */
  async getPendingTeachers() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-teachers`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener profesores pendientes')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getPendingTeachers:', error)
      throw error
    }
  },

  /**
   * Aprobar solicitud de profesor
   * POST /api/admin/approve-teacher/{id}
   */
  async approveTeacher(teacherId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-teacher/${teacherId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al aprobar profesor')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en approveTeacher:', error)
      throw error
    }
  },

  /**
   * Rechazar solicitud de profesor
   * POST /api/admin/reject-teacher/{id}
   * 
   * @param {number} teacherId - ID del profesor
   * @param {string} reason - Razón del rechazo (opcional)
   */
  async rejectTeacher(teacherId, reason = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reject-teacher/${teacherId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al rechazar profesor')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en rejectTeacher:', error)
      throw error
    }
  },

  /**
   * Obtener lista de todos los usuarios
   * GET /api/admin/users
   * 
   * @param {Object} params - Parámetros de filtrado
   * @param {string} params.search - Búsqueda por nombre/email
   * @param {string} params.role - Filtrar por rol (student, teacher, admin)
   * @param {number} params.page - Página actual
   * @param {number} params.perPage - Usuarios por página
   */
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.search) queryParams.append('search', params.search)
      if (params.role) queryParams.append('role', params.role)
      if (params.page) queryParams.append('page', params.page)
      if (params.perPage) queryParams.append('per_page', params.perPage)

      const url = `${API_BASE_URL}/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener usuarios')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getUsers:', error)
      throw error
    }
  },

  /**
   * Obtener detalles de un usuario específico
   * GET /api/admin/users/{id}
   */
  async getUserById(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener usuario')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getUserById:', error)
      throw error
    }
  },

  /**
   * Actualizar usuario
   * PUT /api/admin/users/{id}
   * 
   * @param {number} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @param {string} userData.name - Nombre
   * @param {string} userData.email - Email
   * @param {string} userData.role - Rol (student, teacher, admin)
   */
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar usuario')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en updateUser:', error)
      throw error
    }
  },

  /**
   * Eliminar usuario
   * DELETE /api/admin/users/{id}
   */
  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar usuario')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en deleteUser:', error)
      throw error
    }
  },

  /**
   * Obtener todas las publicaciones (para moderación)
   * GET /api/admin/posts
   */
  async getPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.perPage) queryParams.append('per_page', params.perPage)

      const url = `${API_BASE_URL}/admin/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener publicaciones')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getPosts:', error)
      throw error
    }
  },

  /**
   * Eliminar publicación (moderación)
   * DELETE /api/admin/posts/{id}
   */
  async deletePost(postId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar publicación')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en deletePost:', error)
      throw error
    }
  }
}

export default adminService
