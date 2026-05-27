import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import AuthLayout from '../layouts/AuthLayout';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const bookingId = searchParams.get('booking_id');

        if (!bookingId) {
          setError('Identificador de reserva no encontrado');
          setLoading(false);
          return;
        }

        // Obtener detalles de la reserva
        const response = await paymentService.getBookingDetails(bookingId);
        setBooking(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(
          err.message ||
            'No pudimos verificar el pago. Por favor contacta a soporte.'
        );
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <p className="text-gray-600">Verificando tu pago...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-900 mb-4">
              Error en la verificación
            </h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => navigate('/teachers')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Volver a Profesores
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex justify-center items-center min-h-screen py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <span className="text-6xl">✅</span>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Tu contratación ha sido confirmada y el pago procesado correctamente.
          </p>

          {/* Booking Details */}
          {booking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Profesor:</span>
                <span className="font-semibold text-gray-900">
                  {booking.teacher?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Horas:</span>
                <span className="font-semibold text-gray-900">
                  {booking.hours}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio/hora:</span>
                <span className="font-semibold text-gray-900">
                  ${booking.price_per_hour}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-900 font-semibold">Total pagado:</span>
                <span className="font-bold text-green-600 text-lg">
                  ${booking.total_amount}
                </span>
              </div>
              {booking.status && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {booking.status === 'pending'
                      ? 'Pendiente'
                      : booking.status === 'confirmed'
                        ? 'Confirmado'
                        : booking.status === 'in_progress'
                          ? 'En progreso'
                          : 'Completado'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reference ID */}
          {booking && (
            <p className="text-xs text-gray-500 text-center mb-6">
              ID de reserva: {booking.id}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/bookings')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Ver mis Contrataciones
            </button>
            <button
              onClick={() => navigate('/teachers')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Volver a Buscar Profesores
            </button>
          </div>

          {/* Support Info */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Si tienes problemas, contacta a nuestro equipo de soporte.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
