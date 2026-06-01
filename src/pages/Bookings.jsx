import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paymentService } from '../services/paymentService'
import AuthLayout from '../layouts/AuthLayout'

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [cancelling, setCancelling] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Detectar si viene de un pago confirmado
    const confirmed = searchParams.get('confirmed')
    const bookingId = searchParams.get('booking_id')
    const cancelled = searchParams.get('cancelled')

    if (confirmed && bookingId) {
      confirmPaymentAndBook(bookingId)
    } else if (cancelled) {
      setError('El pago fue cancelado. Intenta nuevamente.')
    }

    loadBookings()
  }, [searchParams])

  const confirmPaymentAndBook = async (bookingId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/payments/confirm-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: parseInt(bookingId),
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('✅ Contratación confirmada. ¡Ahora estás contratado con este profesor!')
        // Limpiar los parámetros de URL
        window.history.replaceState({}, document.title, '/bookings')
      } else {
        console.error('Error confirming:', data)
      }
    } catch (err) {
      console.error('Error confirmando pago:', err)
    }
  }

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await paymentService.getBookings()
      setBookings(response.data || response)
      setError(null)
    } catch (err) {
      console.error('Error loading bookings:', err)
      setError('No pudimos cargar tus contrataciones')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta contratación?')) {
      return
    }

    try {
      setCancelling(bookingId)
      await paymentService.cancelBooking(bookingId, 'Cancelado por el usuario')
      setBookings(bookings.filter((b) => b.id !== bookingId))
    } catch (err) {
      console.error('Error cancelling booking:', err)
      alert('Error cancelando la contratación')
    } finally {
      setCancelling(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    }
    return texts[status] || status
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      refunded: 'text-orange-600',
    }
    return colors[status] || 'text-gray-600'
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Cargando contrataciones...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mis Contrataciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus contrataciones de profesores
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'Todas' : getStatusText(status)}
              </button>
            )
          )}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No hay contrataciones {filter !== 'all' ? `con estado "${getStatusText(filter)}"` : ''}
            </p>
            <Link
              to="/teachers"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Buscar Profesores
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Profesor */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Profesor
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {booking.teacher?.name}
                    </p>
                    {booking.teacher?.subject && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {booking.teacher.subject}
                      </p>
                    )}
                  </div>

                  {/* Duración y Precio */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Duración
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {booking.hours} hora{booking.hours !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      ${booking.price_per_hour}/hora
                    </p>
                  </div>

                  {/* Total */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total
                    </p>
                    <p className="font-semibold text-lg text-green-600">
                      ${booking.total_amount}
                    </p>
                  </div>

                  {/* Estados */}
                  <div className="flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold text-center ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold text-center ${getPaymentStatusColor(
                        booking.payment_status
                      )}`}
                    >
                      💳 {booking.payment_status === 'completed' ? 'Pagado' : 'Por pagar'}
                    </span>
                  </div>
                </div>

                {/* Fechas si están disponibles */}
                {booking.scheduled_start_date && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">📅</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        Inicio: {new Date(booking.scheduled_start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {booking.scheduled_end_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">📅</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          Fin: {new Date(booking.scheduled_end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancelling === booking.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      <span>🗑️</span>
                      {cancelling === booking.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                  <Link
                    to={`/teachers/${booking.teacher?.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition"
                  >
                    Ver Profesor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
