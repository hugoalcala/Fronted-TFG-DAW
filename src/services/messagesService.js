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

      const data = await response.json()
      console.log('✅ Conversations fetched:', data)
      return data.data || data

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
      return data

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
}

export default messagesService
