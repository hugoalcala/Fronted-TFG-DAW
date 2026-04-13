const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Helper para parsear JSON de forma segura
const safeParseJSON = async (response) => {
  const contentLength = response.headers.get('content-length')
  const contentType = response.headers.get('content-type')
  
  // Si el servidor retorna 204 No Content o sin body, retorna null
  if (response.status === 204 || contentLength === '0') {
    return null
  }
  
  // Si no hay content-type JSON, retorna null
  if (!contentType?.includes('application/json')) {
    return null
  }
  
  try {
    return await response.json()
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON response:', error)
    return null
  }
}

export const ratingsService = {
  // Obtener ratings y reseñas de un profesor
  async getTeacherRatings(teacherId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}/ratings`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch ratings')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('❌ Error fetching ratings:', error)
      throw error
    }
  },

  // Crear una nueva reseña
  async createRating(teacherId, ratingData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}/ratings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(ratingData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create rating')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('❌ Error creating rating:', error)
      throw error
    }
  },

  // Obtener profesor detalles (para TeacherProfile)
  async getTeacherDetails(teacherId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.warn(`⚠️ GET /teachers/${teacherId} returned ${response.status}`)
        throw new Error(`HTTP ${response.status}: Failed to fetch teacher details`)
      }

      const data = await response.json()
      console.log('✅ Teacher details fetched:', data)
      return data.data || data
    } catch (error) {
      console.error('❌ Error fetching teacher details:', error)
      throw error
    }
  },

  // Actualizar una reseña existente
  async updateRating(teacherId, ratingId, ratingData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}/ratings/${ratingId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(ratingData),
        }
      )

      if (!response.ok) {
        const errorData = await safeParseJSON(response)
        throw new Error(errorData?.message || 'Failed to update rating')
      }

      const data = await safeParseJSON(response)
      return data?.data || data || { success: true }
    } catch (error) {
      console.error('❌ Error updating rating:', error)
      throw error
    }
  },

  // Eliminar una reseña
  async deleteRating(teacherId, ratingId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}/ratings/${ratingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await safeParseJSON(response)
        throw new Error(errorData?.message || 'Failed to delete rating')
      }

      const data = await safeParseJSON(response)
      return data?.data || data || { success: true }
    } catch (error) {
      console.error('❌ Error deleting rating:', error)
      throw error
    }
  },
}
