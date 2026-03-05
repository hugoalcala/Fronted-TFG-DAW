const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const profileService = {
  // Obtener perfil del usuario actual
  async getProfile() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      console.log('✅ Profile fetched:', data)
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      throw error
    }
  },

  // Actualizar perfil del usuario
  async updateProfile(profileData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(profileData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await response.json()
      console.log('✅ Profile updated:', data)
      
      // Actualizar localStorage con el usuario actualizado
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user))
      }
      
      return data

    } catch (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }
  },

  // Actualizar intereses del usuario
  async updateInterests(interests) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/interests`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ interests }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update interests')
      }

      const data = await response.json()
      console.log('✅ Interests updated:', data)
      return data

    } catch (error) {
      console.error('❌ Error updating interests:', error)
      throw error
    }
  },

  // Actualizar avatar
  async updateAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(
        `${API_BASE_URL}/profile/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update avatar')
      }

      const data = await response.json()
      console.log('✅ Avatar updated:', data)
      
      // Actualizar localStorage con el usuario actualizado
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user))
      }
      
      return data

    } catch (error) {
      console.error('❌ Error updating avatar:', error)
      throw error
    }
  },

  // Obtener estadísticas del usuario
  async getStats() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        // Return empty stats if endpoint doesn't exist
        return {
          courses: 0,
          tasks: 0,
          connections: 0,
          posts: 0,
        }
      }

      const data = await response.json()
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching stats:', error)
      return {
        courses: 0,
        tasks: 0,
        connections: 0,
        posts: 0,
      }
    }
  },

  // Obtener perfil de otro usuario
  async getUserProfile(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      const data = await response.json()
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching user profile:', error)
      throw error
    }
  },

  // Convertirse en profesor
  async becomeTeacher(teacherData = {}, certificateFile = null) {
    try {
      const formData = new FormData()
      
      // Enviar materias como string separado por comas (compatible con backend)
      if (teacherData.subjects && Array.isArray(teacherData.subjects) && teacherData.subjects.length > 0) {
        formData.append('subject', teacherData.subjects.join(', '))
      }
      
      formData.append('bio', teacherData.bio)
      
      if (teacherData.price_per_hour) {
        formData.append('price_per_hour', teacherData.price_per_hour)
      }
      
      if (certificateFile) {
        formData.append('certificate', certificateFile)
      }

      const response = await fetch(
        `${API_BASE_URL}/become-teacher`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            // No incluir Content-Type, el browser lo establece automáticamente con boundary para FormData
          },
          body: formData,
        }
      )

      if (!response.ok) {
        // Si es 404, el endpoint no existe
        if (response.status === 404) {
          throw new Error('404 - Endpoint /api/become-teacher no implementado en el backend')
        }
        
        // Intentar parsear el error como JSON
        let errorData = null
        let jsonError = null
        
        try {
          errorData = await response.json()
        } catch (err) {
          jsonError = err
        }
        
        // Lanzar error con el mensaje del backend si existe, sino usar status/statusText
        if (errorData && errorData.message) {
          throw new Error(errorData.message)
        } else if (jsonError) {
          throw new Error(`Error ${response.status}: ${response.statusText} (no se pudo parsear respuesta JSON)`)
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      console.log('✅ Usuario convertido a profesor:', data)
      
      // Actualizar localStorage con el usuario actualizado
      if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user))
      }
      
      return data

    } catch (error) {
      console.error('❌ Error becoming teacher:', error)
      throw error
    }
  },
}

export default profileService
