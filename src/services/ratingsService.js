const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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
}
