import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

function Dashboard() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está logueado
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userData = localStorage.getItem('user')

    if (isLoggedIn && userData) {
      setUser(JSON.parse(userData))
      setLoading(false)
    } else {
      // Redirigir a login si no está autenticado
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-blue-900 dark:text-blue-400 hover:opacity-80 transition-opacity"
          >
            🎓 EduConnect
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-blue-900 dark:text-white mb-2">
                  Bienvenido, {user?.email?.split('@')[0]}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Haz iniciado sesión correctamente. Este es tu dashboard.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Email: {user?.email}
                </p>
              </div>
              <div className="text-6xl">📚</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Cursos Inscritos
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-2">
                    0
                  </p>
                </div>
                <div className="text-4xl">📖</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Tareas Pendientes
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-2">
                    0
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Calificación Promedio
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-2">
                    --
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">
              Próximamente más contenido
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta página se completará con más funcionalidades una vez que el backend esté listo.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-900 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors font-medium"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
