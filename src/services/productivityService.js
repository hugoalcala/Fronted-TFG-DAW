const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken')
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const productivityService = {
  // Obtener tareas con filtros y paginación
  // Parámetros: status, category, per_page, page
  async getTasks(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.per_page) params.append('per_page', filters.per_page)
      if (filters.page) params.append('page', filters.page)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/tasks${queryString ? '?' + queryString : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeader(),
        credentials: 'include',
      })

      if (!response.ok) throw new Error(`Error fetching tasks: ${response.status}`)
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error getting tasks:', error)
      throw error
    }
  },

  // Crear una nueva tarea (title requerido, category default 'general')
  async createTask(title, description = '', category = 'general', dueDate = null, startDate = null) {
    if (!title || !title.trim()) {
      throw new Error('Title is required')
    }

    try {
      const body = {
        title: title.trim(),
        description,
        category,
      }
      if (dueDate) body.due_date = dueDate
      if (startDate) body.started_at = startDate

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error creating task')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Obtener una tarea específica (403 si no es tuya)
  async getTask(taskId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'GET',
        headers: getAuthHeader(),
        credentials: 'include',
      })

      if (response.status === 403) {
        throw new Error('No tienes permiso para ver esta tarea')
      }
      if (!response.ok) throw new Error('Error fetching task')

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Error getting task:', error)
      throw error
    }
  },

  // Actualizar tarea (PUT/PATCH)
  // Auto-rellena completed_at al completar, lo borra al revertir
  async updateTask(taskId, updates) {
    try {
      // Crear copia para no mutar el objeto original
      const payload = { ...updates }
      
      // Si se marca como completada, agregar timestamp si no existe
      if (payload.completed === true && !payload.completed_at) {
        payload.completed_at = new Date().toISOString()
      }
      // Si se desmarca, remover completed_at
      if (payload.completed === false) {
        payload.completed_at = null
      }

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.status === 403) {
        throw new Error('No tienes permiso para editar esta tarea')
      }
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error updating task')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Eliminar tarea (403 si no es tuya)
  async deleteTask(taskId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      })

      if (response.status === 403) {
        throw new Error('No tienes permiso para eliminar esta tarea')
      }
      if (!response.ok) throw new Error('Error deleting task')

      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  // Obtener sesiones pomodoro con paginación
  async getPomodoroSessions(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.per_page) params.append('per_page', filters.per_page)
      if (filters.page) params.append('page', filters.page)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/pomodoro-sessions${queryString ? '?' + queryString : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeader(),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Error fetching pomodoro sessions')
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error getting pomodoro sessions:', error)
      throw error
    }
  },

  // Registrar una sesión pomodoro completada
  // 422 si el task_id no te pertenece
  async createPomodoroSession(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/pomodoro-sessions`, {
        method: 'POST',
        headers: getAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (response.status === 401) {
        throw new Error('Token inválido o expirado. Por favor, inicia sesión de nuevo.')
      }
      
      if (response.status === 403) {
        throw new Error('No tienes permisos para esta acción')
      }

      if (response.status === 422) {
        const error = await response.json()
        throw new Error(error.message || 'La tarea seleccionada no es válida')
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo guardar la sesión`)
      }

      const responseData = await response.json()
      return responseData.data || responseData
    } catch (error) {
      console.error('Error creando sesión pomodoro:', error.message)
      throw error
    }
  },

  // Obtener métricas de productividad
  // Parámetro period: today|week|month
  async getProductivityMetrics(period = 'week') {
    try {
      const params = new URLSearchParams()
      params.append('period', period)

      const response = await fetch(`${API_BASE_URL}/productivity-metrics?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeader(),
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Error fetching metrics')

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Error getting metrics:', error)
      // Retornar métricas vacías por defecto con los campos correctos del backend
      return {
        period: period ?? 'week',
        total_tasks: 0,
        completed_tasks: 0,
        period_completed: 0,
        completion_rate: 0,
        focus_sessions: 0,
        focus_minutes: 0,
        focus_hours: 0,
        daily_breakdown: [],
      }
    }
  },
}
