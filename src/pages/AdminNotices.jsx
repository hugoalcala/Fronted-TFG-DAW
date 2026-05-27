import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { messagesService } from '../services/messagesService'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'

export default function AdminNotices() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])

  // Verificar que sea admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSendNotice = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Por favor completa el título y el mensaje')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await messagesService.sendAdminNotice(
        title,
        message,
        sendToAll ? null : selectedUsers
      )

      if (result.success) {
        setSuccess(`Aviso enviado a ${result.messages_sent} usuario(s)`)
        setTitle('')
        setMessage('')
        setSelectedUsers([])
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error sending notice:', err)
      setError('Error al enviar el aviso. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Admin Navbar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Enviar Avisos
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
              {success}
            </div>
          )}

          {/* Opción: Enviar a todos o seleccionar */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name="sendTo"
                value="all"
                checked={sendToAll}
                onChange={() => setSendToAll(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Enviar a todos los usuarios
              </span>
            </label>
            <label className="flex items-center gap-3 mt-3">
              <input
                type="radio"
                name="sendTo"
                value="selected"
                checked={!sendToAll}
                onChange={() => setSendToAll(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Seleccionar usuarios específicos
              </span>
            </label>
          </div>

          {/* Título */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título del aviso
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mantenimiento programado del sistema"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              disabled={loading}
              maxLength="255"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {title.length}/255
            </p>
          </div>

          {/* Mensaje */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el contenido del aviso aquí..."
              rows="8"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
              disabled={loading}
              maxLength="5000"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {message.length}/5000
            </p>
          </div>

          {/* Vista previa */}
          {(title || message) && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Vista previa:
              </h3>
              {title && (
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h4>
              )}
              {message && (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {message}
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={handleSendNotice}
              disabled={loading || !title.trim() || !message.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Enviando...
                </span>
              ) : (
                'Enviar aviso'
              )}
            </button>
            <button
              onClick={() => {
                setTitle('')
                setMessage('')
                setError(null)
                setSuccess(null)
              }}
              disabled={loading}
              className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
