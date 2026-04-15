const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Helper para obtener rating promedio de un profesor
const getTeacherAverageRating = async (teacherId) => {
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
      return null
    }

    const data = await response.json()
    return data?.data?.average ?? data?.average ?? null
  } catch (error) {
    console.warn(`⚠️ Failed to fetch rating for teacher ${teacherId}:`, error)
    return null
  }
}

export const teachersService = {
  // Obtener lista de maestros
  async getTeachers(filters = {}) {
    try {
      // Construir query string con filtros
      const searchParams = new URLSearchParams()
      if (filters.search) searchParams.append('search', filters.search)
      if (filters.subject) searchParams.append('subject', filters.subject)

      const response = await fetch(
        `${API_BASE_URL}/teachers?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch teachers')
      }

      const data = await response.json()
      console.log('✅ Teachers fetched:', data)

      // Formato esperado: respuesta paginada Laravel { data: [...] }
      if (Array.isArray(data?.data)) {
        return data.data
      }

      // Compatibilidad por si llega envuelto en otro nivel.
      if (Array.isArray(data?.data?.data)) {
        return data.data.data
      }

      return []

    } catch (error) {
      console.error('❌ Error fetching teachers:', error)
      throw error
    }
  },

  // Obtener detalles de un maestro
  async getTeacher(id) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch teacher')
      }

      const data = await response.json()
      console.log('✅ Teacher fetched:', data)
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching teacher:', error)
      throw error
    }
  },

  // Contactar a un maestro
  async contactTeacher(teacherId, message) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/${teacherId}/contact`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to contact teacher')
      }

      const data = await response.json()
      console.log('✅ Contact message sent:', data)
      return data

    } catch (error) {
      console.error('❌ Error contacting teacher:', error)
      throw error
    }
  },

  // Obtener lista de búsquedas frecuentes (trending)
  async getTrendingSubjects() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teachers/trending/subjects`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        return [] // Return empty array if endpoint doesn't exist yet
      }

      const data = await response.json()
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching trending subjects:', error)
      return [] // Return empty array on error
    }
  },

  // Obtener profesores enriquecidos con su rating promedio
  async getTeachersWithRatings(filters = {}) {
    try {
      const teachers = await this.getTeachers(filters)
      
      // Enriquecer en paralelo con ratings
      const enrichedTeachers = await Promise.all(
        teachers.map(async (teacher) => ({
          ...teacher,
          rating: await getTeacherAverageRating(teacher.id),
        }))
      )
      
      return enrichedTeachers
    } catch (error) {
      console.error('❌ Error fetching teachers with ratings:', error)
      throw error
    }
  },
}

export default teachersService
