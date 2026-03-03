import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-bold text-blue-900 dark:text-blue-400 hover:opacity-80 transition-opacity"
          >
            🎓 EduConnect
          </button>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {/* Búsqueda de Profesores */}
            <button
              onClick={() => navigate('/teachers')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
            >
              👨‍🏫 Profesores
            </button>

            {/* Chat/Mensajes */}
            <button
              onClick={() => navigate('/messages')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors relative"
            >
              💬 Mensajes
              {/* Badge de nuevos mensajes */}
              {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span> */}
            </button>

            {/* Perfil */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
            >
              👤 Perfil
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
                navigate('/teachers')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              👨‍🏫 Profesores
            </button>

            <button
              onClick={() => {
                navigate('/messages')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              💬 Mensajes
            </button>

            <button
              onClick={() => {
                navigate('/profile')
                setMenuOpen(false)
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              👤 Perfil
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
