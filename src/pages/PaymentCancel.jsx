import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Obtener razón de cancelación de los parámetros
    const cancelReason = searchParams.get('reason');
    if (cancelReason) {
      const reasons = {
        user_cancelled: 'Cancelaste el pago',
        payment_method_failed: 'Tu método de pago fue rechazado',
        session_expired: 'Tu sesión expiró',
        insufficient_funds: 'Fondos insuficientes',
      };
      setReason(reasons[cancelReason] || 'Pago cancelado');
    } else {
      setReason('Cancelaste el pago');
    }
  }, [searchParams]);

  return (
    <AuthLayout>
      <div className="flex justify-center items-center min-h-screen py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          {/* Warning Icon */}
          <div className="text-center mb-6">
            <span className="text-6xl">⚠️</span>
          </div>

          {/* Cancel Message */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Pago Cancelado
          </h1>
          <p className="text-center text-gray-600 mb-6">{reason}</p>

          {/* Explanation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              No se realizó ningún cargo a tu cuenta. Puedes intentar de nuevo
              cuando quieras.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/teachers')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Intentar Nuevamente
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Volver Atrás
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center mb-3">
              ¿Necesitas ayuda?
            </p>
            <button
              onClick={() => navigate('/support')}
              className="w-full text-blue-600 hover:text-blue-700 font-semibold py-1 text-sm transition"
            >
              Contactar Soporte
            </button>
          </div>

          {/* FAQ Info */}
          <div className="mt-4 bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-600 mb-2 font-semibold">
              Preguntas frecuentes:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• ¿Por qué se canceló? Verifica tu método de pago</li>
              <li>• ¿Fue debitada mi cuenta? No, de lo contrario te reembolsaremos</li>
              <li>• ¿Puedo reintentar? Sí, en cualquier momento</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
