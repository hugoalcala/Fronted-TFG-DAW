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
  const [error, setError] = useState(null)
  
  // Filtros y búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage] = useState(10)
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // Filtros de fecha y ordenamiento
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // desc = más reciente primero, asc = más antiguo primero
  
  // Modal de edición
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Notificación toast
  const [notification, setNotification] = useState(null)
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    loadAdminData()
    loadUsers() // Cargar usuarios al inicio también
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, searchTerm, roleFilter, currentPage, startDate, endDate, sortOrder])

  const loadAdminData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar estadísticas
      const statsData = await adminService.getStats()
      
      // Cargar profesores pendientes
      const teachersData = await adminService.getPendingTeachers()
      // Asegurar que sea un array
      const teachersArray = Array.isArray(teachersData) ? teachersData : []
      setPendingTeachers(teachersArray)
      
      // Actualizar stats con el conteo real de pendientes
      setStats({
        ...statsData,
        pendingApplications: teachersArray.length
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
      setError(error.message || 'Error al cargar datos del panel de administración')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const params = {
        page: currentPage,
        perPage: perPage,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchTerm || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: 'created_at',
        sortOrder: sortOrder,
      }

      console.log('Cargando usuarios con params:', params)
      const response = await adminService.getUsers(params)
      console.log('Respuesta de usuarios:', response)
      
      // La respuesta incluye paginación de Laravel
      if (Array.isArray(response)) {
        // Si la respuesta es un array directo sin paginación
        setUsers(response)
        setTotalPages(1)
      } else if (response.data) {
        // Si viene con paginación de Laravel - confiar en el filtrado del backend
        setUsers(response.data)
        setTotalPages(response.last_page || 1)
        setCurrentPage(response.current_page || currentPage)
      } else {
        // Si no hay estructura reconocida
        console.warn('Estructura de respuesta no reconocida:', response)
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showNotification('Error al cargar usuarios: ' + error.message, 'error')
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleApproveTeacher = async (teacherId) => {
    if (!confirm('¿Aprobar esta solicitud de profesor?')) return

    try {
      await adminService.approveTeacher(teacherId)
      
      // Remover de la lista de pendientes localmente
      setPendingTeachers(pendingTeachers.filter(t => t.id !== teacherId))
      
      // Actualizar stats
      setStats(prev => ({
        ...prev,
        pendingApplications: Math.max(0, prev.pendingApplications - 1),
        totalTeachers: prev.totalTeachers + 1
      }))
      
      showNotification('Profesor aprobado exitosamente', 'success')
    } catch (error) {
      console.error('Error al aprobar:', error)
      showNotification('Error al aprobar: ' + error.message, 'error')
    }
  }

  const handleRejectTeacher = async (teacherId) => {
    const reason = prompt('¿Motivo del rechazo? (opcional)')
    if (reason === null) return // Usuario canceló

    try {
      await adminService.rejectTeacher(teacherId, reason)
      
      // Remover de la lista de pendientes localmente
      setPendingTeachers(pendingTeachers.filter(t => t.id !== teacherId))
      
      // Actualizar stats
      setStats(prev => ({
        ...prev,
        pendingApplications: Math.max(0, prev.pendingApplications - 1)
      }))
      
      showNotification('Solicitud rechazada', 'success')
    } catch (error) {
      console.error('Error al rechazar:', error)
      showNotification('Error al rechazar: ' + error.message, 'error')
    }
  }

  const handleViewCertificate = async (teacherId) => {
    try {
      await adminService.viewCertificate(teacherId)
    } catch (error) {
      console.error('Error al ver certificado:', error)
      showNotification('Error al cargar el certificado: ' + error.message, 'error')
    }
  }

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      await adminService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      })
      
      // Actualizar localmente en lugar de recargar todo
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, name: editingUser.name, email: editingUser.email, role: editingUser.role }
          : u
      ))
      
      // Solo recargar stats si cambió el rol (afecta contadores)
      const originalUser = users.find(u => u.id === editingUser.id)
      if (originalUser && originalUser.role !== editingUser.role) {
        const statsData = await adminService.getStats()
        setStats(statsData)
      }
      
      setShowEditModal(false)
      setEditingUser(null)
      showNotification('Usuario actualizado exitosamente', 'success')
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      showNotification('Error al actualizar: ' + error.message, 'error')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await adminService.deleteUser(userId)
      
      // Actualizar localmente eliminando el usuario de la lista
      setUsers(users.filter(u => u.id !== userId))
      
      // Actualizar stats solo para el contador
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1
      }))
      
      showNotification('Usuario eliminado exitosamente', 'success')
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      showNotification('Error al eliminar: ' + error.message, 'error')
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset a la primera página
  }

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value)
    setCurrentPage(1) // Reset a la primera página
  }

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value)
    setCurrentPage(1)
  }

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value)
    setCurrentPage(1)
  }

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStartDate('')
    setEndDate('')
    setSortOrder('desc')
    setCurrentPage(1)
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

  if (error && !stats.totalUsers) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadAdminData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
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
                                  {teacher.user?.name || teacher.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.user?.email || teacher.email}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Materia</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {teacher.subject || '-'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Precio/hora</label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {teacher.price_per_hour != null ? `$${teacher.price_per_hour}` : 'No especificado'}
                                </p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="text-xs text-gray-600 dark:text-gray-400">Biografía</label>
                              <p className="text-sm text-gray-900 dark:text-white">{teacher.bio || '-'}</p>
                            </div>

                            <div className="mb-4">
                              {teacher.certificate_path && (
                                <button
                                  onClick={() => handleViewCertificate(teacher.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm inline-flex items-center gap-2 bg-transparent border-none cursor-pointer"
                                >
                                  📄 Ver Certificado/CV
                                </button>
                              )}
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
                
                {/* Filtros y búsqueda */}
                <div className="mb-6 space-y-4">
                  {/* Primera fila: Búsqueda y Rol */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Buscar
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rol
                      </label>
                      <select
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="all">Todos los roles</option>
                        <option value="student">Estudiantes</option>
                        <option value="teacher">Profesores</option>
                        <option value="admin">Administradores</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Segunda fila: Fechas y Ordenamiento */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="w-full md:w-56">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ordenar por fecha
                      </label>
                      <select
                        value={sortOrder}
                        onChange={handleSortOrderChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="desc">Más reciente primero</option>
                        <option value="asc">Más antiguo primero</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                      >
                        🔄 Limpiar Filtros
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicador de filtros activos */}
                  {(searchTerm || roleFilter !== 'all' || startDate || endDate || sortOrder !== 'desc') && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Filtros activos:</span>
                      {searchTerm && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">🔍 Búsqueda: "{searchTerm}"</span>}
                      {roleFilter !== 'all' && <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">👤 Rol: {roleFilter}</span>}
                      {startDate && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded">📅 Desde: {startDate}</span>}
                      {endDate && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded">📅 Hasta: {endDate}</span>}
                      {sortOrder !== 'desc' && <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded">↕️ Orden: {sortOrder === 'asc' ? 'Más antiguo primero' : 'Más reciente primero'}</span>}
                    </div>
                  )}
                </div>

                {/* Tabla de usuarios */}
                {loadingUsers ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm || roleFilter !== 'all' || startDate || endDate || sortOrder !== 'desc'
                        ? 'No se encontraron usuarios con esos filtros' 
                        : 'No hay usuarios registrados'}
                    </p>
                    <button
                      onClick={loadUsers}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      🔄 Recargar
                    </button>
                  </div>
                ) : (
                  <>
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
                                <button 
                                  onClick={() => handleEditUser(u)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="text-red-600 dark:text-red-400 hover:underline"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ← Anterior
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Siguiente →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edición de Usuario */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Editar Usuario
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificación Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : notification.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            <span className="text-2xl">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
