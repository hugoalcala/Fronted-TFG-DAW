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
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-blue-900 dark:text-white mb-4">
              Bienvenido a EduConnect
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
          <h2 className="text-2xl font-semibold text-center text-blue-900 dark:text-white mb-8">
            ¿Qué es EduConnect?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-medium text-blue-900 dark:text-white mb-2">
                Conexión
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Conecta con estudiantes, profesores y profesionales de tu campo educativo
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-medium text-blue-900 dark:text-white mb-2">
                Comunicación
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactúa a través de mensajes, comentarios y espacios colaborativos
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-blue-900 dark:text-white mb-2">
                Educación Digital
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a contenido educativo, cursos y recursos para tu aprendizaje
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you can do Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-blue-900 dark:text-white mb-8">
            Qué puedes hacer en EduConnect
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-white mb-2">
                  Registrarte e Iniciar Sesión
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Crea tu cuenta y accede a toda la plataforma con seguridad
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-white mb-2">
                  Publicar Contenido
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Comparte tus ideas, proyectos y recursos educativos
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-white mb-2">
                  Interactuar con Otros
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Comenta, reacciona y colabora con la comunidad
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-white mb-2">
                  Acceder a Contenido Educativo
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualiza cursos, tutoriales y recursos de aprendizaje
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-400 dark:to-blue-500 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Únete a nuestra comunidad académica
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Empieza ahora y conecta con miles de estudiantes y educadores
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
