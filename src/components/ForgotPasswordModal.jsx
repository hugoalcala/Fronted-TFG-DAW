import { useState } from 'react'
import authService from '../services/authService'

function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState('email') // 'email', 'password', 'success'
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validar email
    if (!email) {
      setError('Por favor ingresa tu email.')
      setLoading(false)
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido.')
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Verificando email...')
      await authService.verifyEmailExists(email)
      console.log('✅ Email verificado, pasando a cambio de contraseña')
      setStep('password')
      setError('')
      setLoading(false)
    } catch (err) {
      console.error('❌ Error verificando email:', err.message)
      setError(err.message || 'Error al verificar el email.')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos.')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Cambiando contraseña...')
      await authService.resetPassword(email, newPassword, confirmPassword)
      console.log('✅ Contraseña cambiada exitosamente')
      setSuccess('✅ Contraseña cambiadaexitosamente. Puedes iniciar sesión con tu nueva contraseña.')
      setStep('success')
      setLoading(false)
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      console.error('❌ Error cambiando contraseña:', err.message)
      setError(err.message || 'Error al cambiar la contraseña.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Resetear el estado
    setStep('email')
    setEmail('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-white">
              {step === 'email' && 'Recuperar Contraseña'}
              {step === 'password' && 'Nueva Contraseña'}
              {step === 'success' && 'Éxito'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-100 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-green-800 dark:text-green-100 text-sm">{success}</p>
            </div>
          )}

          {/* Email Verification Step */}
          {step === 'email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ingresa tu email para verificarque estésregistrado en nuestra plataforma.
              </p>
              <div>
                <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="recovery-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@educonnect.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Email'}
              </button>
            </form>
          )}

          {/* Password Reset Step */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ingresa tu nueva contraseña para {email}
              </p>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mínimo 8 caracteres
                </p>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2 disabled:opacity-50"
              >
                {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-2 text-blue-900 dark:text-blue-400 font-medium hover:underline"
              >
                Volver
              </button>
            </form>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tu contraseña ha sido cambiada exitosamente. Cierra este modal para volver al login.
              </p>
              <button
                onClick={handleClose}
                className="w-full btn-primary py-2"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ForgotPasswordModal
