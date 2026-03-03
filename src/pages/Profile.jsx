import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'

export default function Profile() {
  const { user } = useAuth()

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl shadow-lg">
                👤
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name || 'Usuario'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  ID: {user?.id}
                </p>
              </div>
            </div>
            
            {/* Edit Button */}
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Información Personal */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Información Personal
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Nombre Completo</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Tipo de Usuario</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.role || 'Estudiante'}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📊 Estadísticas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tareas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conexiones</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Intereses */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⭐ Tus Intereses
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Selecciona tus intereses para recibir contenido personalizado
          </p>
          <div className="flex flex-wrap gap-2">
            {['Programación', 'Matemáticas', 'Inglés', 'Historia', 'Ciencias', 'Diseño'].map((interest) => (
              <button
                key={interest}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
