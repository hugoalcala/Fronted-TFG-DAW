const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const paymentService = {
  // Crear sesión de pago con Stripe
  async createPaymentIntent(teacherId, hours = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          hours: hours,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error creando intención de pago')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error creating payment intent:', error)
      throw error
    }
  },

  // Confirmar pago
  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error confirmando pago')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error confirming payment:', error)
      throw error
    }
  },

  // Obtener key pública de Stripe
  async getStripePublicKey() {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/stripe-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error obteniendo clave de Stripe')
      }

      const data = await response.json()
      return data.public_key
    } catch (error) {
      console.error('❌ Error getting Stripe public key:', error)
      throw error
    }
  },

  // Obtener historial de contrataciones
  async getBookings() {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error obteniendo contrataciones')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error getting bookings:', error)
      throw error
    }
  },

  // Obtener detalles de una contratación
  async getBookingDetails(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error obteniendo detalles de contratación')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error getting booking details:', error)
      throw error
    }
  },

  // Cancelar contratación
  async cancelBooking(bookingId, reason = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          reason: reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error cancelando contratación')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error canceling booking:', error)
      throw error
    }
  },
}
