const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const messagesService = {
  // Obtener lista de conversaciones
  async getConversations() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const responseData = await response.json()
      console.log('✅ Raw response:', responseData)
      
      // Asegurar que retornamos un array
      const conversations = responseData.data || responseData
      console.log('✅ Conversations after extraction:', conversations)
      
      return Array.isArray(conversations) ? conversations : []

    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
      throw error
    }
  },

  // Obtener mensajes de una conversación
  async getMessages(conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      console.log('✅ Messages fetched:', data)
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      throw error
    }
  },

  // Enviar un mensaje
  async sendMessage(conversationId, message) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      console.log('✅ Message sent:', data)
      return data

    } catch (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }
  },

  // Crear nueva conversación
  async createConversation(userId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      console.log('✅ Conversation created:', data)
      // Retornar solo los datos de la conversación, no el wrapper
      return data.data ? { data: data.data } : data

    } catch (error) {
      console.error('❌ Error creating conversation:', error)
      throw error
    }
  },

  // Marcar conversación como leída
  async markAsRead(conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations/${conversationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('❌ Error marking as read:', error)
      throw error
    }
  },

  // Admin: Enviar aviso a usuarios específicos o a todos
  async sendAdminNotice(title, message, recipientIds = null) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/notices`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            title,
            message,
            recipient_ids: recipientIds,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to send admin notice')
      }

      const data = await response.json()
      console.log('✅ Admin notice sent:', data)
      return data

    } catch (error) {
      console.error('❌ Error sending admin notice:', error)
      throw error
    }
  },

  // Obtener avisos/notificaciones del admin
  async getAdminNotices() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/notices`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch admin notices')
      }

      const data = await response.json()
      console.log('✅ Admin notices fetched:', data)
      return data.data || []

    } catch (error) {
      console.error('❌ Error fetching admin notices:', error)
      throw error
    }
  },

  // Reportar un usuario
  async reportUser(reportedUserId, reason, details = null) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/report-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            reported_user_id: reportedUserId,
            reason,
            details,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to report user')
      }

      const data = await response.json()
      console.log('✅ User reported:', data)
      return data

    } catch (error) {
      console.error('❌ Error reporting user:', error)
      throw error
    }
  },

  // Eliminar una conversación
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      const data = await response.json()
      console.log('✅ Conversation deleted:', data)
      return data

    } catch (error) {
      console.error('❌ Error deleting conversation:', error)
      throw error
    }
  },
}

export default messagesService
