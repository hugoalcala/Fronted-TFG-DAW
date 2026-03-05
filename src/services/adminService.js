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
      const url = `${API_BASE_URL}/admin/stats`
      console.log('🔍 Llamando a stats:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      console.log('📡 Stats response status:', response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error('❌ Error en stats:', text)
        throw new Error(`Error al obtener estadísticas: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Stats recibidas:', data)
      return data
    } catch (error) {
      console.error('💥 Error en getStats:', error)
      throw error
    }
  },

  /**
   * Obtener lista de profesores pendientes de aprobación
   * GET /api/admin/pending-teachers
   */
  async getPendingTeachers() {
    try {
      const url = `${API_BASE_URL}/admin/pending-teachers`
      console.log('🔍 Llamando a pending-teachers:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      console.log('📡 Pending teachers response status:', response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error('❌ Error en pending-teachers:', text)
        
        // Si es 404, devolver array vacío en lugar de error
        if (response.status === 404) {
          console.warn('⚠️ Endpoint no encontrado, devolviendo array vacío')
          return []
        }
        
        throw new Error(`Error al obtener profesores pendientes: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Pending teachers recibidos:', data)
      // El backend devuelve { data: [...] }
      return data.data || data
    } catch (error) {
      console.error('💥 Error en getPendingTeachers:', error)
      // Si el endpoint no existe, devolver array vacío
      return []
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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: reason })
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
   * Obtener y mostrar el certificado de una solicitud de profesor
   * Descarga el PDF con autenticación y lo abre en una nueva pestaña
   * 
   * @param {number} teacherId - ID de la solicitud de profesor
   */
  async viewCertificate(teacherId) {
    // Abrir popup inmediatamente para preservar el gesto del usuario
    const popup = window.open('', '_blank')
    
    try {
      const url = `${API_BASE_URL}/admin/teacher-request/${teacherId}/certificate`
      console.log('🔍 Intentando cargar certificado desde:', url)
      console.log('📋 Teacher ID:', teacherId)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        if (popup) popup.close()
        throw new Error(`Error ${response.status}: No se pudo cargar el certificado`)
      }

      // Obtener el blob del PDF
      const blob = await response.blob()
      console.log('✅ PDF cargado, tamaño:', blob.size, 'bytes')
      
      // Crear una URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Navegar el popup ya abierto a la URL del blob
      if (popup) {
        popup.location.href = blobUrl
      }
      
      // Liberar la URL después de un tiempo más largo
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
    } catch (error) {
      console.error('💥 Error al cargar certificado:', error)
      if (popup) popup.close()
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
   * @param {string} params.startDate - Fecha inicio (YYYY-MM-DD)
   * @param {string} params.endDate - Fecha fin (YYYY-MM-DD)
   * @param {string} params.sortBy - Campo para ordenar (created_at)
   * @param {string} params.sortOrder - Orden (asc, desc)
   */
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.search) queryParams.append('search', params.search)
      if (params.role) queryParams.append('role', params.role)
      if (params.page) queryParams.append('page', params.page)
      if (params.perPage) queryParams.append('per_page', params.perPage)
      if (params.startDate) queryParams.append('start_date', params.startDate)
      if (params.endDate) queryParams.append('end_date', params.endDate)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const url = `${API_BASE_URL}/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      console.log('🔍 Llamando a:', url)
      console.log('📦 Headers:', getAuthHeaders())

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        // Intentar obtener el texto de la respuesta para debug
        const text = await response.text()
        console.error('❌ Error response:', text)
        
        // Intentar parsear como JSON
        try {
          const error = JSON.parse(text)
          throw new Error(error.message || `Error ${response.status}: ${response.statusText}`)
        } catch {
          throw new Error(`Error ${response.status}: El servidor respondió con un error. Verifica que el endpoint ${url} existe en el backend.`)
        }
      }

      const data = await response.json()
      console.log('✅ Usuarios recibidos:', data)
      return data
    } catch (error) {
      console.error('💥 Error en getUsers:', error)
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
