import { useState } from 'react'
import AuthLayout from '../layouts/AuthLayout'

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [newMessage, setNewMessage] = useState('')

  // Mock data - después será del backend
  const chats = [
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
    {
      id: 3,
      name: 'Lic. Carlos Rodríguez',
      lastMessage: 'Excelente trabajo en la lección anterior',
      timestamp: 'hace 5 horas',
      unread: 0,
      avatar: '👨‍🏫',
      messages: []
    },
  ]

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      console.log('Enviando mensaje:', newMessage)
      setNewMessage('')
    }
  }

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

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
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
                  <span className="text-4xl">{chat.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                      {chat.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {chat.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {chat.timestamp}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
              <span className="text-4xl">{selectedChat.avatar}</span>
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
              {selectedChat.messages.length > 0 ? (
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
                    Sin mensajes anteriores
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Enviar
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
