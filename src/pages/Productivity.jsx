import { useState, useEffect } from 'react'
import AuthLayout from '../layouts/AuthLayout'
import PomodoroTimer from '../components/PomodoroTimer'
import TodoList from '../components/TodoList'
import ProductivityMetrics from '../components/ProductivityMetrics'
import { productivityService } from '../services/productivityService'

export default function Productivity() {
  const [activeTab, setActiveTab] = useState('pomodoro')
  const [refreshMetrics, setRefreshMetrics] = useState(0)

  const handlePomodoroSessionComplete = () => {
    setRefreshMetrics((prev) => prev + 1)
  }

  return (
    <AuthLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Centro de Productividad
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organiza tus tareas, mantén el enfoque con Pomodoro y mide tu progreso
          </p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'pomodoro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            Tareas
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'metrics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            Metricas
          </button>
        </div>

        <div className="space-y-8">
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
              <ProductivityMetrics refreshTrigger={refreshMetrics} />
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
