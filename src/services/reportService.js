const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Helper para logging condicional en desarrollo
const isDev = import.meta.env.DEV
const logger = {
  debug: (msg, data) => isDev && console.log(msg, data),
  error: (msg, data) => console.error(msg, data),
}

export const reportService = {
  // Obtener todas las denuncias (solo admin)
  async getAllReports(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.reason) params.append('reason', filters.reason)
      if (filters.page) params.append('page', filters.page)
      if (filters.perPage) params.append('per_page', filters.perPage)
      if (filters.sortBy) params.append('sort_by', filters.sortBy)
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder)

      const url = `${API_BASE_URL}/admin/reports${params.toString() ? '?' + params : ''}`
      logger.debug('📋 Fetching reports from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('❌ HTTP Error response:', errorData)
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }

      const data = await response.json()
      logger.debug('📋 Reports response data:', data)
      
      // Devolver la respuesta completa para que el AdminDashboard acceda a paginación
      return data
    } catch (error) {
      logger.error('❌ Error fetching reports:', error)
      throw error
    }
  },

  // Obtener detalles de una denuncia
  async getReportDetails(reportId) {
    try {
      const url = `${API_BASE_URL}/admin/reports/${reportId}`
      logger.debug('📋 Fetching report details from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch report`)
      }

      const data = await response.json()
      console.log('📋 Report details:', data)
      
      // Devolver el objeto de denuncia completo
      return data.data || data
    } catch (error) {
      console.error('❌ Error fetching report details:', error)
      throw error
    }
  },

  // Aprobar una denuncia (eliminar reseña)
  async approveReport(reportId, adminNotes = '') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ admin_notes: adminNotes }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to approve report`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('❌ Error approving report:', error)
      throw error
    }
  },

  // Rechazar una denuncia
  async rejectReport(reportId, adminNotes = '') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/reports/${reportId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ admin_notes: adminNotes }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to reject report`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('❌ Error rejecting report:', error)
      throw error
    }
  },

  // Enviar mensaje a usuario (usado en el futuro para el sistema de chat/mensajería)
  // TODO: Integrar con la interfaz de chat cuando se implemente
  // Mantener este método para uso futuro en la notificación manual a usuarios sobre decisiones de denuncias
  async sendMessageToUser(userId, subject, message) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ subject, message }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to send message`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('❌ Error sending message:', error)
      throw error
    }
  },
}
