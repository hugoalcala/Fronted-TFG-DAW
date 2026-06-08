import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'

export default function MyClasses() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [filter, setFilter] = useState('pending') // pending, confirmed, all

  // Si no es profesor, redirigir
  if (user && user.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/bookings`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Error cargando solicitudes')
      }

      const data = await response.json()
      const allBookings = data.data || []
      
      // Filtrar solo los bookings donde el usuario es profesor
      const teacherBookings = allBookings.filter(b => b.teacher_id === user?.id)
      
      setBookings(teacherBookings)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (bookingId) => {
    try {
      setError(null)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/bookings/${bookingId}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aceptar solicitud')
      }

      setSuccess('¡Solicitud aceptada! El estudiante ha sido añadido a tu lista de clases.')
      setTimeout(() => setSuccess(null), 3000)
      
      loadBookings()
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    }
  }

  const handleReject = async (bookingId, reason = '') => {
    try {
      setError(null)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/bookings/${bookingId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reason || 'Rechazado por el profesor',
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al rechazar solicitud')
      }

      setSuccess('Solicitud rechazada')
      setTimeout(() => setSuccess(null), 3000)
      
      loadBookings()
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    }
  }

  const getPendingBookings = () => {
    return bookings.filter(b => b.status === 'pending')
  }

  const getConfirmedBookings = () => {
    return bookings.filter(b => b.status === 'confirmed')
  }

  const displayBookings = filter === 'pending' ? getPendingBookings() : 
                         filter === 'confirmed' ? getConfirmedBookings() : 
                         bookings

  const pendingCount = getPendingBookings().length

  return (
    <AuthLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Clases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus estudiantes y solicitudes de contratación</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">Solicitudes pendientes:</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingCount}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-300">✅ {success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Pendientes ({getPendingBookings().length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'confirmed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Aceptadas ({getConfirmedBookings().length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({bookings.length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayBookings.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {filter === 'pending' && 'No hay solicitudes pendientes'}
            {filter === 'confirmed' && 'No tienes estudiantes confirmados aún'}
            {filter === 'all' && 'No hay contrataciones'}
          </p>
        </div>
      )}

      {/* Bookings List */}
      {!loading && displayBookings.length > 0 && (
        <div className="grid gap-4">
          {displayBookings.map(booking => (
            <div
              key={booking.id}
              className={`border rounded-lg p-6 transition-all ${
                booking.status === 'pending'
                  ? 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10'
                  : booking.status === 'confirmed'
                  ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 self-start">
                  {/* Información del estudiante */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.student?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estudiante
                    </p>
                  </div>

                  {/* Detalles de la clase */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">HORAS</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{booking.hours}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">PRECIO/HORA</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${booking.price_per_hour}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">TOTAL</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${booking.total_amount}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">ESTADO</p>
                      <span className={`mt-1 text-sm font-semibold ${
                        booking.status === 'pending'
                          ? 'text-yellow-500 dark:text-yellow-300'
                          : booking.status === 'confirmed'
                          ? 'text-green-500 dark:text-green-400'
                          : booking.status === 'cancelled'
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {booking.status === 'pending' && 'Pendiente'}
                        {booking.status === 'confirmed' && 'Confirmada'}
                        {booking.status === 'cancelled' && 'Cancelada'}
                        {booking.status === 'completed' && 'Completada'}
                        {booking.status === 'in_progress' && 'En progreso'}
                      </span>
                    </div>
                  </div>

                  {/* Notas */}
                  {booking.notes && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">NOTAS</p>
                      <p className="text-gray-700 dark:text-gray-300">{booking.notes}</p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {booking.scheduled_start_date && (
                      <p>📅 Inicio: {new Date(booking.scheduled_start_date).toLocaleDateString('es-ES')}</p>
                    )}
                    {booking.scheduled_end_date && (
                      <p>📅 Fin: {new Date(booking.scheduled_end_date).toLocaleDateString('es-ES')}</p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                {booking.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(booking.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthLayout>
  )
}
