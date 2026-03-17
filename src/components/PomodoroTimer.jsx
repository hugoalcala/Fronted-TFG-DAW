import { useState, useEffect, useRef } from 'react'
import { productivityService } from '../services/productivityService'

export default function PomodoroTimer({ onSessionComplete }) {
  const [customWorkTime, setCustomWorkTime] = useState(25) // Tiempo de trabajo en minutos
  const [seconds, setSeconds] = useState(25 * 60) // 25 minutos inicial
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [selectedTask, setSelectedTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(null)
  const [sessionStartTime, setSessionStartTime] = useState(null) // Rastrear cuándo inició realmente

  const WORK_TIME = customWorkTime * 60
  const BREAK_TIME = 5 * 60

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      // Obtener solo tareas pendientes o en progreso
      const taskList = await productivityService.getTasks({ per_page: 50 })
      // Filtrar tareas que no estén completadas
      setTasks(taskList.filter(t => t.status !== 'completed' && !t.completed))
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let interval = null

    if (isActive && seconds > 0) {
      // Registrar cuándo inició la sesión (solo la primera vez)
      if (!sessionStartTime) {
        setSessionStartTime(Date.now())
      }
      
      interval = setInterval(() => {
        setSeconds((s) => s - 1)
      }, 1000)
    } else if (seconds === 0 && isActive) {
      handleSessionComplete()
    } else if (!isActive) {
      // Resetear cuando se pausa
      setSessionStartTime(null)
    }

    return () => clearInterval(interval)
  }, [isActive, seconds, sessionStartTime])

  const handleSessionComplete = async () => {
    console.log('🔔 handleSessionComplete iniciado')
    
    // Reproducir sonido de notificación
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }

    setIsActive(false)

    // Guardar sesión en backend
    try {
      // Calcular tiempo REAL que pasó, no la duración configurada
      const timeElapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : (isBreak ? BREAK_TIME : WORK_TIME)
      const durationMinutes = Math.max(1, Math.ceil(timeElapsed / 60)) // Mínimo 1 minuto
      
      const sessionData = {
        duration_minutes: durationMinutes,
        task_id: selectedTask?.id || null,
        type: isBreak ? 'short_break' : 'focus',
        started_at: new Date(Date.now() - timeElapsed * 1000).toISOString(),
        completed: true,
      }

      console.log('📤 Enviando sesión pomodoro:', sessionData)
      const response = await productivityService.createPomodoroSession(sessionData)
      console.log('✅ Sesión pomodoro guardada:', response)
    } catch (error) {
      console.error('❌ Error saving pomodoro session:', error.message)
      console.error('Error completo:', error)
      // Mostrar mensaje de error pero continuar con el flujo
      if (error.message.includes('no es válida')) {
        alert('⚠️ La tarea seleccionada no te pertenece. Desvinculando...')
        setSelectedTask(null)
      }
    }

    if (!isBreak) {
      setSessionsCompleted((prev) => prev + 1)
      if (onSessionComplete) {
        onSessionComplete()
      }
      // Cambiar a descanso
      setIsBreak(true)
      setSeconds(BREAK_TIME)
    } else {
      // Volver a sesión de trabajo
      setIsBreak(false)
      setSeconds(WORK_TIME)
    }
    
    setSessionStartTime(null) // Resetear
  }

  const toggleTimer = () => {
    if (!isActive) {
      // Al iniciar, registrar la hora
      setSessionStartTime(Date.now())
    } else {
      // Al pausar, resetear
      setSessionStartTime(null)
    }
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setSessionStartTime(null)
    setSeconds(isBreak ? BREAK_TIME : WORK_TIME)
  }

  const updateWorkTime = (newTime) => {
    const minutes = Math.max(1, Math.min(60, newTime)) // Entre 1 y 60 minutos
    setCustomWorkTime(minutes)
    if (!isActive && !isBreak) {
      setSeconds(minutes * 60)
    }
  }

  const skipSession = async () => {
    setIsActive(false)
    
    if (isBreak) {
      setIsBreak(false)
      setSeconds(WORK_TIME)
      setSessionStartTime(null)
    } else {
      // Guardar sesión en backend cuando se salta una sesión de trabajo
      try {
        // Calcular tiempo REAL que pasó
        const timeElapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : WORK_TIME
        const durationMinutes = Math.max(1, Math.ceil(timeElapsed / 60)) // Mínimo 1 minuto
        
        const sessionData = {
          duration_minutes: durationMinutes,
          task_id: selectedTask?.id || null,
          type: 'focus',
          started_at: new Date(Date.now() - timeElapsed * 1000).toISOString(),
          completed: false,
        }
        console.log('📤 Guardando sesión pomodoro (skip):', sessionData)
        await productivityService.createPomodoroSession(sessionData)
        console.log('✅ Sesión guardada exitosamente')
        
        // Solo incrementar sesiones completadas si se guardó correctamente
        setSessionsCompleted((prev) => prev + 1)
        if (onSessionComplete) {
          onSessionComplete()
        }
      } catch (error) {
        console.error('❌ Error guardando sesión:', error.message)
        alert('⚠️ No se pudo guardar la sesión. Revisa la conexión con el servidor.')
        return
      }
      
      setSessionStartTime(null)
      setIsBreak(true)
      setSeconds(BREAK_TIME)
    }
  }

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const progressPercent = ((isBreak ? BREAK_TIME : WORK_TIME) - seconds) / (isBreak ? BREAK_TIME : WORK_TIME) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
      />

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        {isBreak ? '☕ Descanso' : '⏱️ Pomodoro'}
      </h2>

      {/* Temporizador principal */}
      <div className="relative w-48 h-48 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercent / 100)}`}
            className={`${
              isBreak ? 'text-green-500' : 'text-red-500'
            } transition-all duration-300`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white font-mono">
              {formatTime(seconds)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {isBreak ? 'Minutos de descanso' : 'Minutos de enfoque'}
            </div>
          </div>
        </div>
      </div>

      {/* Sesiones completadas */}
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Sesiones completadas: <span className="font-bold text-2xl text-blue-600">{sessionsCompleted}</span>
        </p>
      </div>

      {/* Tiempo personalizado de concentración */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ⏱️ Tiempo de concentración (minutos):
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="60"
            value={customWorkTime}
            onChange={(e) => updateWorkTime(parseInt(e.target.value) || 1)}
            disabled={isActive}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">min</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">El descanso será de 5 minutos</p>
      </div>

      {/* Tarea seleccionada */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tarea en progreso:
        </label>
        <select
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = tasks.find((t) => t.id === parseInt(e.target.value))
            setSelectedTask(task || null)
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sin tarea específica</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      {/* Controles */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
            isActive
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isActive ? '⏸️ Pausar' : '▶️ Iniciar'}
        </button>
        <button
          onClick={resetTimer}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
        >
          🔄 Reiniciar
        </button>
        <button
          onClick={skipSession}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
        >
          ⏭️ Saltar
        </button>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <p className="font-semibold mb-2">💡 Técnica Pomodoro:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Elige tu tiempo de concentración (1-60 minutos)</li>
          <li>5 minutos de descanso automático</li>
          <li>Después de 4 ciclos, descanso mayor recomendado</li>
        </ul>
      </div>
    </div>
  )
}
