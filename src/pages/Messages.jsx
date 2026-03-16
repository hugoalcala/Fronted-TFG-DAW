import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { messagesService } from '../services/messagesService'
import { useAuth } from '../context/AuthContext'

export default function Messages() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState(null)

  // Cargar conversaciones
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        const data = await messagesService.getConversations()
        setConversations(Array.isArray(data) ? data : [])

        // Si viene un parámetro newChat, auto-seleccionar esa conversación
        const newChatId = searchParams.get('newChat')
        if (newChatId) {
          // TODO: Buscar conversación existente o crear una nueva
          console.log('Iniciando chat con profesor:', newChatId)
        }

        // Si viene conversation, seleccionar esa
        const conversationId = searchParams.get('conversation')
        if (conversationId) {
          const foundConversation = Array.isArray(data)
            ? data.find((conv) => conv.id === parseInt(conversationId))
            : null
          if (foundConversation) {
            setSelectedChat(foundConversation)
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err)
        setError('No se pudieron cargar los mensajes')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [searchParams])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    setSendingMessage(true)
    try {
      // TODO: Enviar mensaje al backend
      await messagesService.sendMessage(selectedChat.id, {
        message: newMessage.trim(),
      })
      console.log('Mensaje enviado')
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Error al enviar el mensaje')
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Mock data para cuando no hay datos del backend
  const chats = conversations.length > 0
    ? conversations
    : [
        {
          id: 1,
          name: 'Dr. Juan García',
          lastMessage: 'Vale, nos vemos mañana a las 3pm',
          timestamp: 'hace 2 horas',
          unread: 2,
          avatar: '👨‍🏫',
          messages: [
            { id: 1, sender: 'Dr. Juan García', text: 'Hola, ¿cómo estás?', time: '10:30' },
            { id: 2, sender: 'Tú', text: 'Bien, ¿y tú?', time: '10:32' },
            { id: 3, sender: 'Dr. Juan García', text: 'Vale, nos vemos mañana a las 3pm', time: '10:35' },
          ]
        },
        {
          id: 2,
          name: 'Ing. María López',
          lastMessage: 'El proyecto está listo para revisar',
          timestamp: 'hace 1 hora',
          unread: 0,
          avatar: '👩‍💼',
          messages: []
        },
      ]

  return (
    <AuthLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              💬 Mensajes
            </h2>
          </div>

          {error && (
            <div className="m-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full px-6 py-4 border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{chat.avatar || '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {chat.name}
                        </h3>
                        {chat.unread > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage || 'Sin mensajes'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {chat.timestamp}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                No tienes conversaciones aún
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
              <span className="text-4xl">{selectedChat.avatar || '👤'}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedChat.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  En línea
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedChat.messages && selectedChat.messages.length > 0 ? (
                selectedChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'Tú' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'Tú'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-600 dark:text-gray-400">
                    Sin mensajes anteriores. ¡Inicia la conversación!
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Selecciona un chat para empezar
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
