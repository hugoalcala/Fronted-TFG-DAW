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
  const [showMenuChat, setShowMenuChat] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportingUser, setReportingUser] = useState(false)
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
        
        // Asegurar que tenemos un array
        const conversationsArray = Array.isArray(data) ? data : (data?.data || [])
        console.log('📋 Conversaciones cargadas:', conversationsArray.length, conversationsArray)
        setConversations(conversationsArray)

        // Si viene un parámetro newChat, crear o encontrar conversación con ese usuario
        const newChatId = searchParams.get('newChat')
        if (newChatId) {
          console.log('📍 Iniciando chat con profesor:', newChatId)
          
          const existingConv = conversationsArray.find(
            (conv) => String(conv.recipient_id) === String(newChatId) || String(conv.user_id) === String(newChatId)
          )
          
          if (existingConv) {
            console.log('✅ Conversación existente encontrada:', existingConv)
            if (currentRequestId === requestIdRef.current) {
              setSelectedChat(existingConv)
            }
          } else {
            console.log('🆕 Creando nueva conversación con usuario ID:', newChatId)
            try {
              const newConversation = await messagesService.createConversation(newChatId)
              
              // Proteger contra requests obsoletas
              if (currentRequestId !== requestIdRef.current) return
              
              // Extraer los datos correctamente
              const created = newConversation?.data || newConversation
              console.log('✅ Conversación creada:', created)
              
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
            const foundConversation = conversationsArray.find((conv) => String(conv.id) === String(conversationId))
            console.log('🔍 Buscando conversación:', conversationId, 'Encontrada:', foundConversation)
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

  // Marcar chat como leído cuando se selecciona
  const handleSelectChat = async (chat) => {
    console.log('📖 Marcando conversación como leída:', chat.id)
    setSelectedChat(chat)
    
    // Quitar notificación de mensajes sin leer
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === chat.id
          ? { ...conv, unread: 0 }
          : conv
      )
    )
    
    // Llamar al backend para marcar como leído
    try {
      await messagesService.markAsRead(chat.id)
    } catch (err) {
      console.error('❌ Error al marcar como leído:', err)
    }
  }

  // Escuchar tecla ESC para deseleccionar chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedChat) {
        console.log('🚪 ESC presionado - Deseleccionando chat')
        setSelectedChat(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedChat])

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

  const handleDeleteConversation = async () => {
    if (!selectedChat || !window.confirm('¿Estás seguro de que deseas eliminar esta conversación?')) return

    try {
      await messagesService.deleteConversation(selectedChat.id)
      setConversations((prev) => prev.filter((conv) => conv.id !== selectedChat.id))
      setSelectedChat(null)
      setShowMenuChat(false)
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('Error al eliminar la conversación')
    }
  }

  const handleReportUser = async () => {
    if (!reportReason.trim() || !selectedChat) return

    setReportingUser(true)
    try {
      // El otro usuario es siempre recipient_id en selectedChat
      const userToReport = selectedChat.recipient_id || selectedChat.user_id
      await messagesService.reportUser(userToReport, reportReason, reportDetails)
      setShowReportModal(false)
      setReportReason('')
      setReportDetails('')
      setShowMenuChat(false)
      alert('Denuncia enviada a administración exitosamente')
    } catch (err) {
      console.error('Error reporting user:', err)
      setError(err.message || 'Error al enviar la denuncia')
    } finally {
      setReportingUser(false)
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
               Mensajes
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
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full px-6 py-4 border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {chat.avatar && chat.avatar.includes('://') ? (
                        <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-4xl">{chat.avatar || '👤'}</span>
                      )}
                    </div>
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
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  {selectedChat.avatar && selectedChat.avatar.includes('://') ? (
                    <img src={selectedChat.avatar} alt={selectedChat.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-4xl">{selectedChat.avatar || '👤'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedChat.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    En línea
                  </p>
                </div>
              </div>

              {/* Menu de 3 puntos */}
              <div className="relative">
                <button
                  onClick={() => setShowMenuChat(!showMenuChat)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <span className="text-2xl">⋮</span>
                </button>

                {showMenuChat && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <button
                      onClick={() => {
                        setShowReportModal(true)
                        setShowMenuChat(false)
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-b border-gray-200 dark:border-gray-700"
                    >
                      Denunciar usuario
                    </button>
                    <button
                      onClick={handleDeleteConversation}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Eliminar chat
                    </button>
                  </div>
                )}
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

      {/* Modal de denuncia */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Denunciar usuario
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Reporta a {selectedChat?.name} por el motivo que consideres
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo de la denuncia
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="acoso">Acoso o intimidación</option>
                  <option value="contenido_inapropiado">Contenido inapropiado</option>
                  <option value="spam">Spam</option>
                  <option value="fraude">Fraude</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe el problema..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDetails('')
                  }}
                  disabled={reportingUser}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReportUser}
                  disabled={reportingUser || !reportReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportingUser ? 'Enviando...' : 'Denunciar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

