import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { messagesService } from '../services/messagesService'

export default function Messages() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  // Cargar conversaciones
  useEffect(() => {
    const loadConversations = async () => {
      const currentRequestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)
        const data = await messagesService.getConversations()
        
        // Ignorar si hay una request más nueva
        if (currentRequestId !== requestIdRef.current) return
        
        setConversations(Array.isArray(data) ? data : [])

        // Si viene un parámetro newChat, crear o encontrar conversación con ese usuario
        const newChatId = searchParams.get('newChat')
        if (newChatId) {
          console.log('📍 Iniciando chat con profesor:', newChatId)
          const conversationsArray = Array.isArray(data) ? data : []
          const existingConv = conversationsArray.find(
            (conv) => String(conv.recipient_id) === String(newChatId) || String(conv.user_id) === String(newChatId)
          )
          
          if (existingConv) {
            console.log('✅ Conversación existente encontrada')
            if (currentRequestId === requestIdRef.current) {
              setSelectedChat(existingConv)
            }
          } else {
            console.log('🆕 Creando nueva conversación')
            try {
              const newConversation = await messagesService.createConversation(newChatId)
              
              // Proteger contra requests obsoletas
              if (currentRequestId !== requestIdRef.current) return
              
              const created = newConversation.data || newConversation
              setSelectedChat(created)
              setConversations((prev) => [...prev, created])
            } catch (err) {
              console.error('❌ Error creating conversation:', err)
              // Mostrar error al usuario
              if (currentRequestId === requestIdRef.current) {
                setError('No se pudo iniciar la conversación. Intenta de nuevo.')
              }
            }
          }
        }

        // Si viene conversation, seleccionar esa (solo si newChat no fue manejado)
        else if (!newChatId) {
          const conversationId = searchParams.get('conversation')
          if (conversationId) {
            const foundConversation = Array.isArray(data)
              ? data.find((conv) => String(conv.id) === String(conversationId))
              : null
            if (foundConversation && currentRequestId === requestIdRef.current) {
              setSelectedChat(foundConversation)
            }
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err)
        // Proteger contra requests obsoletas antes de actualizar estado
        if (currentRequestId === requestIdRef.current) {
          setError('No se pudieron cargar los mensajes')
        }
      } finally {
        // Proteger contra requests obsoletas antes de actualizar estado
        if (currentRequestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }

    loadConversations()
  }, [searchParams])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    setSendingMessage(true)
    const targetChatId = selectedChat.id
    const messageText = newMessage.trim()
    setError(null)
    
    try {
      await messagesService.sendMessage(targetChatId, messageText)
      console.log('✅ Mensaje enviado')
      setNewMessage('')
      
      // Crear objeto de mensaje consistente
      const newMsg = {
        id: Date.now(),
        sender: 'Tú',
        text: messageText,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      }
      
      // Actualizar conversación en la lista
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === targetChatId
            ? {
                ...conv,
                lastMessage: messageText,
                messages: [...(conv.messages || []), newMsg],
              }
            : conv
        )
      )
      
      // Actualizar selectedChat solo si aún es el mismo
      setSelectedChat((prev) =>
        prev?.id === targetChatId
          ? {
              ...prev,
              lastMessage: messageText,
              messages: [...(prev.messages || []), newMsg],
            }
          : prev
      )
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

  // Usar conversaciones reales del backend
  const chats = conversations

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
            {chats && chats.length > 0 ? (
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
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No tienes conversaciones aún
                </p>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendingMessage) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
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
