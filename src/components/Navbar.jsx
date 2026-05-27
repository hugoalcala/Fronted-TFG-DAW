import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { messagesService } from '../services/messagesService'
import logo from '../assets/educonnect_logo.png'

export default function Navbar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar mensajes sin leer cada 30 segundos y cuando vuelve a la pestaña
  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        const conversations = await messagesService.getConversations()
        const conversationsArray = Array.isArray(conversations) ? conversations : (conversations?.data || [])
        const unread = conversationsArray.reduce((sum, conv) => sum + (conv.unread || 0), 0)
        setUnreadCount(unread)
      } catch (err) {
        console.error('Error loading unread messages:', err)
      }
    }

    loadUnreadMessages()
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadUnreadMessages, 30000)
    
    // Recargar cuando el usuario vuelve a la ventana
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUnreadMessages()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src={logo}
              alt="EduConnect"
              className="h-10 w-auto"
            />
          </button>

          {/* Espacio flexible */}
          <div className="flex-grow"></div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {/* Inicio */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
            >
              Inicio
            </button>

            {/* Búsqueda de Profesores */}
            {user?.role !== 'teacher' ? (
              <button
                onClick={() => navigate('/teachers')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
              >
                 Profesores
              </button>
            ) : (
              <button
                onClick={() => navigate('/my-classes')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
              >
                 Mis Clases
              </button>
            )}

            {/* Chat/Mensajes */}
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors relative"
            >
               Mensajes
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Productividad */}
            <button
              onClick={() => navigate('/productivity')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
            >
               Productividad
            </button>

            {/* Admin: Avisos */}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin/notices')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
              >
                Avisos
              </button>
            )}

            {/* Perfil con rol */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
            >
               Perfil
              {user?.role === 'teacher' && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  Profesor
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Menu Mobile Desplegable */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <button
              onClick={() => {
                navigate('/dashboard')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
               Inicio
            </button>

            {user?.role !== 'teacher' ? (
              <button
                onClick={() => {
                  navigate('/teachers')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                 Profesores
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/my-classes')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                 Mis Clases
              </button>
            )}

            <button
              onClick={() => {
                navigate('/messages')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative"
            >
               Mensajes
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 ml-2 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                navigate('/productivity')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Productividad
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigate('/admin/notices')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Avisos
              </button>
            )}

            <button
              onClick={() => {
                navigate('/profile')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
               Perfil {user?.role === 'teacher' && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full ml-2">Profesor</span>}
            </button>

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
