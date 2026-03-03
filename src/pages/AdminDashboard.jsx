import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import adminService from '../services/adminService'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingTeachers, setPendingTeachers] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    pendingApplications: 0,
    totalPosts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Cargar estadísticas
      const statsData = await adminService.getStats()
      setStats(statsData)

      // Cargar profesores pendientes
      const teachersData = await adminService.getPendingTeachers()
      setPendingTeachers(teachersData)

      // Cargar usuarios
      const usersData = await adminService.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      // Si falla, mostrar mock data para desarrollo
      setStats({
        totalUsers: 124,
        totalTeachers: 15,
        pendingApplications: 3,
        totalPosts: 48,
      })

      setPendingTeachers([
        {
          id: 1,
          name: 'Juan García',
          email: 'juan@example.com',
          subject: 'Matemáticas',
          bio: 'Ingeniero con 10 años de experiencia',
          price_per_hour: '30',
          certificate_url: '/certificates/cert1.pdf',
          created_at: '2026-03-01',
        },
        {
          id: 2,
          name: 'María López',
          email: 'maria@example.com',
          subject: 'Programación',
          bio: 'Desarrolladora Full Stack',
          price_per_hour: '35',
          certificate_url: '/certificates/cert2.pdf',
          created_at: '2026-03-02',
        },
      ])

      setUsers([
        { id: 1, name: 'Ana Rodríguez', email: 'ana@example.com', role: 'student', created_at: '2026-01-15' },
        { id: 2, name: 'Carlos Ruiz', email: 'carlos@example.com', role: 'teacher', created_at: '2026-02-20' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTeacher = async (teacherId) => {
    if (!confirm('¿Aprobar esta solicitud de profesor?')) return

    try {
      await adminService.approveTeacher(teacherId)
      alert('✅ Profesor aprobado exitosamente')
      // Recargar datos para actualizar estadísticas
      await loadAdminData()
    } catch (error) {
      console.error('Error al aprobar:', error)
      alert('Error al aprobar: ' + error.message)
    }
  }

  const handleRejectTeacher = async (teacherId) => {
    const reason = prompt('¿Motivo del rechazo? (opcional)')
    if (reason === null) return // Usuario canceló

    try {
      await adminService.rejectTeacher(teacherId, reason)
      alert('❌ Solicitud rechazada')
      // Recargar datos para actualizar estadísticas
      await loadAdminData()
    } catch (error) {
      console.error('Error al rechazar:', error)
      alert('Error al rechazar: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-purple-900/30">
      {/* Admin Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-400">
                👑 Panel de Administración
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Bienvenido, {user?.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-purple-400 transition-colors"
              >
                📚 Ver Dashboard Normal
              </button>
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
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Usuarios</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Profesores</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.totalTeachers}</p>
              </div>
              <div className="text-4xl">👨‍🏫</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-yellow-200 dark:border-yellow-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pendingApplications}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Posts</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.totalPosts}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'pending'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ⏳ Profesores Pendientes
              {stats.pendingApplications > 0 && (
                <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.pendingApplications}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              👥 Usuarios
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard General</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Actividad Reciente</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {stats.pendingApplications} solicitudes de profesor esperando aprobación
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Acciones Rápidas</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('pending')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Ver Pendientes
                      </button>
                      <button
                        onClick={() => setActiveTab('users')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Gestionar Usuarios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Teachers Tab */}
            {activeTab === 'pending' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Solicitudes de Profesor Pendientes
                </h2>
                
                {pendingTeachers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-600 dark:text-gray-400">No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl">
                                👤
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {teacher.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.email}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Materia</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {teacher.subject}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Precio/hora</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${teacher.price_per_hour}
                                </p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="text-xs text-gray-600 dark:text-gray-400">Biografía</label>
                              <p className="text-sm text-gray-900 dark:text-white">{teacher.bio}</p>
                            </div>

                            <div className="mb-4">
                              <a
                                href={teacher.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                              >
                                📄 Ver Certificado/CV
                              </a>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Solicitado: {new Date(teacher.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleApproveTeacher(teacher.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectTeacher(teacher.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              ✗ Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gestión de Usuarios</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Rol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Registro
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{u.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{u.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'teacher'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : u.role === 'admin'
                                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                              Editar
                            </button>
                            <button className="text-red-600 dark:text-red-400 hover:underline">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
