import { useState, useEffect } from 'react'
import { productivityService } from '../services/productivityService'

export default function TodoList() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('general')
  const [expandedTask, setExpandedTask] = useState(null)

  const categories = ['general', 'trabajo', 'personal', 'estudio', 'salud']
  const statuses = ['pending', 'in_progress', 'completed']
  const statusLabels = {
    pending: ' Pendiente',
    in_progress: ' En Progreso',
    completed: ' Completada',
  }
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200',
    in_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200',
    completed: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200',
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const taskList = await productivityService.getTasks({ per_page: 50 })
      setTasks(taskList || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      alert('Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      setLoading(true)
      await productivityService.createTask(newTask.trim(), '', category, newDueDate || null)
      setNewTask('')
      setNewDueDate('')
      // Recargar tareas para obtener la tarea creada con todas las fechas del backend
      await loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error al crear la tarea')
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (task) => {
    try {
      // Ciclar entre estados: pending -> in_progress -> completed -> pending
      const currentStatusIndex = statuses.indexOf(task.status || 'pending')
      const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
      const nextStatus = statuses[nextStatusIndex]

      const updated = await productivityService.updateTask(task.id, {
        status: nextStatus,
        completed: nextStatus === 'completed',
      })
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)))
    } catch (error) {
      console.error('Error updating task:', error)
      if (error.message.includes('No tienes permiso')) {
        alert('No tienes permiso para editar esta tarea')
        loadTasks()
      } else {
        alert('Error al actualizar la tarea')
      }
    }
  }

  const changeTaskStatus = async (task, newStatus) => {
    try {
      const updated = await productivityService.updateTask(task.id, {
        status: newStatus,
        completed: newStatus === 'completed',
      })
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)))
      setExpandedTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      if (error.message.includes('No tienes permiso')) {
        alert('No tienes permiso para editar esta tarea')
        loadTasks()
      } else {
        alert('Error al actualizar la tarea')
      }
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return

    try {
      await productivityService.deleteTask(taskId)
      setTasks(tasks.filter((t) => t.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
      if (error.message.includes('No tienes permiso')) {
        alert('No puedes eliminar esta tarea')
      } else {
        alert('Error al eliminar la tarea: ' + error.message)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: '2-digit' })
  }

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed' || task.completed) return false
    const dueDate = new Date(task.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.status === 'completed' || task.completed
    if (filter === 'pending') return task.status === 'pending' || (!task.completed && task.status !== 'in_progress')
    if (filter === 'in_progress') return task.status === 'in_progress'
    return true
  })

  const completedCount = tasks.filter((t) => t.status === 'completed' || t.completed).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 overflow-x-hidden">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white"> Mi Lista de Tareas</h2>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 p-3 sm:p-4 rounded-lg text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{tasks.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-3 sm:p-4 rounded-lg text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{completedCount}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Hechas</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-3 sm:p-4 rounded-lg text-center">
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{completionRate}%</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Progreso</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progreso general</span>
          <span className="font-semibold text-gray-900 dark:text-white">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Formulario para nueva tarea */}
      <form onSubmit={addTask} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Fecha límite"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !newTask.trim()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
           Agregar Tarea
        </button>
      </form>

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {[
          { key: 'all', label: 'Todas', count: tasks.length },
          { key: 'pending', label: 'Pendientes', count: tasks.filter((t) => t.status === 'pending' || (!t.completed && t.status !== 'in_progress')).length },
          { key: 'in_progress', label: 'En Progreso', count: tasks.filter((t) => t.status === 'in_progress').length },
          { key: 'completed', label: 'Completadas', count: tasks.filter((t) => t.status === 'completed' || t.completed).length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2 py-2 rounded-lg font-medium transition-all text-sm text-center ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Lista de tareas */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {loading ? ' Cargando tareas...' : ' No hay tareas aquí'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                task.status === 'completed' || task.completed
                  ? 'bg-gray-100 dark:bg-gray-700 border-green-200 dark:border-green-800'
                  : task.status === 'in_progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              {/* Botón de estado - click para cambiar */}
              <button
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                className={`flex-shrink-0 w-8 h-8 rounded-full font-bold transition-all flex items-center justify-center text-sm ${
                  task.status === 'completed' || task.completed
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : task.status === 'in_progress'
                      ? 'bg-blue-500 text-white hover:bg-blue-600 animate-pulse'
                      : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                }`}
                title="Click para cambiar estado"
              >
                {task.status === 'completed' || task.completed ? '✓' : task.status === 'in_progress' ? '⏳' : '○'}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium truncate ${
                    task.status === 'completed' || task.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex gap-2 mt-1 flex-wrap items-center text-xs">
                  {task.started_at && (
                    <span className="text-gray-500 dark:text-gray-400">
                     Iniciada: {formatDate(task.started_at)}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`${isOverdue(task) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                       Límite: {formatDate(task.due_date)} {isOverdue(task) && '⚠️'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap items-center">
                  {task.category && (
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded ${
                        task.category === 'trabajo'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                          : task.category === 'personal'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                            : task.category === 'estudio'
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                              : task.category === 'salud'
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[task.status] || statusColors.pending}`}>
                    {statusLabels[task.status] || statusLabels.pending}
                  </span>
                </div>

                {/* Menú de cambio de estado expandible */}
                {expandedTask === task.id && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cambiar a:</p>
                    <div className="flex gap-2 flex-wrap">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => changeTaskStatus(task, status)}
                          disabled={task.status === status}
                          className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                            task.status === status
                              ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                              : status === 'pending'
                                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                                : status === 'in_progress'
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                className="flex-shrink-0 px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-all"
                title="Editar estado de la tarea"
              >
                ✏️
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="flex-shrink-0 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-all"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
