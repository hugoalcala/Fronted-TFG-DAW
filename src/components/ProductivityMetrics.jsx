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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Tus Métricas</h2>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="day">Hoy</option>
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
              icon="✅"
              color="green"
            />
            <MetricCard
              label="Total de tareas"
              value={metrics.total_tasks || 0}
              icon="📝"
              color="blue"
            />
            <MetricCard
              label="Sesiones Pomodoro"
              value={metrics.focus_sessions || 0}
              icon="🍅"
              color="red"
            />
            <MetricCard
              label="Minutos de enfoque"
              value={metrics.focus_minutes || 0}
              icon="⏱️"
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
                {metrics.completion_rate || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.completion_rate || 0}%` }}
              />
            </div>
          </div>

          {/* Gráfico de actividad */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Actividad {timeFrame === 'day' ? 'hoy' : timeFrame === 'week' ? 'esta semana' : 'este mes'}
            </h3>
            <div className="flex items-end justify-between gap-2 h-40 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {(metrics.daily_breakdown && metrics.daily_breakdown.length > 0) ? (
                metrics.daily_breakdown.map((item, idx) => {
                  const maxTasks = Math.max(...metrics.daily_breakdown.map(d => d.completed_tasks || 0), 1)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t relative group cursor-pointer"
                        style={{ height: `${maxTasks > 0 ? ((item.completed_tasks || 0) / maxTasks) * 100 : 0}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {item.completed_tasks || 0} tareas
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {item.date ? new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )
                })
              ) : (
                // Gráfico vacío si no hay datos
                [0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-t" style={{ height: '20%' }} />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'][idx]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Botón de actualizar */}
          <button
            onClick={loadMetrics}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            🔄 Actualizar métricas
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
