import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { paymentService } from '../services/paymentService'

export default function HireTeacherModal({ teacher, isOpen, onClose, onSuccess }) {
  const [hours, setHours] = useState(1)
  const [totalPrice, setTotalPrice] = useState(teacher?.price_per_hour || 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stripe, setStripe] = useState(null)
  const [elements, setElements] = useState(null)
  const [cardElement, setCardElement] = useState(null)

  // Cargar Stripe cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadStripeKey()
    }
  }, [isOpen])

  // Calcular precio total
  useEffect(() => {
    if (teacher?.price_per_hour) {
      setTotalPrice((teacher.price_per_hour * hours).toFixed(2))
    }
  }, [hours, teacher])

  const loadStripeKey = async () => {
    try {
      const publicKey = await paymentService.getStripePublicKey()
      const stripeInstance = await loadStripe(publicKey)
      setStripe(stripeInstance)
    } catch (err) {
      setError('Error cargando Stripe')
      console.error(err)
    }
  }

  const handleHiringProcess = async () => {
    if (!teacher) return

    setLoading(true)
    setError(null)

    try {
      // 1. Crear sesión de checkout
      const checkoutResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/payments/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_id: teacher.id,
            hours: hours,
          }),
        }
      )

      const checkoutData = await checkoutResponse.json()
      
      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Error creando sesión de pago')
      }

      const { checkout_url } = checkoutData

      // 2. Redirigir a Stripe Checkout usando el URL completo que devuelve Stripe
      if (!checkout_url) {
        throw new Error('No se recibió URL de pago de Stripe')
      }
      
      window.location.href = checkout_url
    } catch (err) {
      setError(err.message || 'Error procesando el pago')
      console.error(err)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💼 Contratar profesor
          </h2>
          <p className="text-sm text-blue-100 mt-1">
            {teacher?.name} - {teacher?.subject}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
              ⚠️ <span>{error}</span>
            </div>
          )}

          {/* Información del profesor */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Profesor
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {teacher?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tarifa por hora
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${teacher?.price_per_hour}
              </span>
            </div>
          </div>

          {/* Selector de horas */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              ¿Cuántas horas deseas contratar?
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setHours(Math.max(1, hours - 1))}
                disabled={hours === 1}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={hours}
                onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setHours(Math.min(100, hours + 1))}
                disabled={hours === 100}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                horas
              </span>
            </div>
          </div>

          {/* Resumen de precio */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {hours} hora{hours > 1 ? 's' : ''} × ${teacher?.price_per_hour}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
              <span className="font-semibold text-gray-900 dark:text-white">
                Total a pagar
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${totalPrice}
              </span>
            </div>
          </div>

          {/* Aviso de seguridad */}
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            🔒 Los pagos se procesan de forma segura con Stripe
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleHiringProcess}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Procesando...
              </>
            ) : (
              <>
                💳 Pagar y Contratar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
