import { useState } from 'react'
import AuthLayout from '../layouts/AuthLayout'
import PomodoroTimer from '../components/PomodoroTimer'
import TodoList from '../components/TodoList'
import ProductivityMetrics from '../components/ProductivityMetrics'

export default function Productivity() {
  const [activeTab, setActiveTab] = useState('overview')
  const [pomodorosCompletedThisSession, setPomodorosCompletedThisSession] = useState(0)

  const handlePomodoroSessionComplete = () => {
    setPomodorosCompletedThisSession((prev) => prev + 1)
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🚀 Centro de Productividad
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organiza tus tareas, mantén el enfoque con Pomodoro y mide tu progreso
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            📊 Resumen
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'pomodoro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            ⏱️ Pomodoro
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            📋 Tareas
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'metrics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            📈 Métricas
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Tarjetas de resumen rápido */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-sm opacity-90">Sesión en progreso</h3>
                  <p className="text-3xl font-bold">Pomodoro</p>
                  <p className="text-xs opacity-75 mt-2">Mantén el enfoque</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl mb-2">📝</div>
                  <h3 className="text-sm opacity-90">Tareas hoy</h3>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-xs opacity-75 mt-2">Pendientes de completar</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="text-sm opacity-90">Racha</h3>
                  <p className="text-3xl font-bold">0 días</p>
                  <p className="text-xs opacity-75 mt-2">Mantén la consistencia</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⚡ Inicio rápido</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('pomodoro')}
                      className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                    >
                      🍅 Iniciar Pomodoro
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
                    >
                      ➕ Nueva tarea
                    </button>
                    <button
                      onClick={() => setActiveTab('metrics')}
                      className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
                    >
                      📊 Ver métricas
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💡 Consejos diarios</h3>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Empieza con las tareas más importantes primero</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Usa Pomodoro para mantener el enfoque</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Toma descansos regulares</span>
                    </li>
                    <li className="flex gap-2">
                      <span>✓</span>
                      <span>Revisa tus métricas al fin del día</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pomodoro' && (
            <div className="flex justify-center">
              <PomodoroTimer onSessionComplete={handlePomodoroSessionComplete} />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-4xl mx-auto">
              <TodoList />
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="max-w-4xl mx-auto">
              <ProductivityMetrics />
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
