import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import logo from '../assets/educonnect_logo.png'

function Home() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src={logo}
              alt="EduConnect"
              className="h-10 w-auto"
            />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              EduConnect
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              La plataforma de educación digital que conecta estudiantes, profesores y comunidades académicas en un único espacio
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary px-8 py-4 text-lg"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => navigate('/registro')}
              className="btn-outline px-8 py-4 text-lg"
            >
              Registrarse
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
            Características Principales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Conexión
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Conecta con estudiantes, profesores y profesionales
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Comunicación
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactúa a través de mensajes y comentarios
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Contenido Educativo
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a recursos para tu aprendizaje
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you can do Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
            Funcionalidades
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-800 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Cuenta
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Registrarte e iniciar sesión con seguridad
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Publicar
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Comparte tus ideas y recursos educativos
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Interactuar
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Comenta y colabora con la comunidad
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Aprender
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a cursos y recursos de aprendizaje
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 dark:bg-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Comienza Ahora
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Crea tu cuenta y conecta con estudiantes y educadores
          </p>
          <button 
            onClick={() => navigate('/registro')}
            className="btn-secondary px-8 py-4 text-lg"
          >
            Crear Cuenta Ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="mb-2">
            © 2026 EduConnect. Conectando educación y comunidad.
          </p>
          <p className="text-gray-400 text-sm">
            Hecho por Hugo Pascual 
          </p>
        </div>
      </footer>
    </>
  )
}

export default Home
