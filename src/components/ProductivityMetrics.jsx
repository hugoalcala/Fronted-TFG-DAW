import { useState, useEffect } from 'react'
import { productivityService } from '../services/productivityService'

export default function ProductivityMetrics({ refreshTrigger }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timeFrame, setTimeFrame] = useState('week')

  useEffect(() => {
    loadMetrics()
    // Recargar métricas cada minuto
    const interval = setInterval(loadMetrics, 60000)
    return () => clearInterval(interval)
  }, [timeFrame])

  // Recargar cuando se complete un pomodoro
  useEffect(() => {
    if (refreshTrigger) {
      loadMetrics()
    }
  }, [refreshTrigger])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const data = await productivityService.getProductivityMetrics(timeFrame)
      setMetrics(data)
    } catch (error) {
      console.error('Error loading metrics:', error)
      alert('Error al cargar métricas')
    } finally {
      setLoading(false)
    }
  }



  if (loading && !metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white"> Tus Métricas</h2>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>

      {metrics ? (
        <div className="space-y-6">
          {/* Cards principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Tareas completadas"
              value={metrics.completed_tasks || 0}
              color="green"
            />
            <MetricCard
              label="Total de tareas"
              value={metrics.total_tasks || 0}
              color="blue"
            />
            <MetricCard
              label="Sesiones Pomodoro"
              value={metrics.focus_sessions || 0}
              color="red"
            />
            <MetricCard
              label="Minutos de enfoque"
              value={metrics.focus_minutes || 0}
              color="purple"
            />
          </div>

          {/* Progreso general */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                Tasa de Completitud
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.max(0, Math.min(100, metrics.completion_rate || 0))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, metrics.completion_rate || 0))}%` }}
              />
            </div>
          </div>

          {/* Botón de actualizar */}
          <button
            onClick={loadMetrics}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
             Actualizar métricas
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No hay datos disponibles aún. ¡Comienza a usar la productividad!</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon, color }) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg text-center`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
    </div>
  )
}
