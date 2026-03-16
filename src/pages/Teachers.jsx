import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { teachersService } from '../services/teachersService'
import { useAuth } from '../context/AuthContext'

const teachersCache = new Map()

const getFiltersCacheKey = (searchTerm) =>
  JSON.stringify({ search: (searchTerm ?? '').trim().toLowerCase() })

export default function Teachers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('todas')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const hasLoadedOnceRef = useRef(false)
  const requestIdRef = useRef(0)

  const normalizeTeacher = (teacher) => {
    const userNode = teacher?.user || teacher
    return {
      id: teacher?.id ?? userNode?.id ?? crypto.randomUUID(),
      name: teacher?.name ?? userNode?.name ?? '',
      subject: teacher?.subject ?? teacher?.specialty ?? userNode?.subject ?? '',
      rating: teacher?.rating ?? userNode?.rating ?? null,
      students_count: teacher?.students_count ?? teacher?.students ?? userNode?.students_count ?? 0,
      avatar_url: teacher?.avatar_url ?? userNode?.avatar_url ?? null,
      bio: teacher?.bio ?? userNode?.bio ?? '',
      price_per_hour: teacher?.price_per_hour ?? userNode?.price_per_hour ?? null,
      price: teacher?.price ?? userNode?.price ?? null,
      image: teacher?.image ?? userNode?.image ?? null,
    }
  }

  const normalizeText = (value) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  // Obtener profesores del backend
  useEffect(() => {
    const fetchTeachers = async () => {
      const currentRequestId = ++requestIdRef.current
      try {
        const cacheKey = getFiltersCacheKey(searchTerm)
        const cachedTeachers = teachersCache.get(cacheKey)

        if (cachedTeachers && Array.isArray(cachedTeachers)) {
          setTeachers(cachedTeachers)
          setLoading(false)
          hasLoadedOnceRef.current = true
          setIsRefreshing(true)
        } else if (!hasLoadedOnceRef.current) {
          setLoading(true)
        } else {
          setIsRefreshing(true)
        }
        setError(null)
        
        const filters = {}
        // La asignatura se filtra en cliente para soportar valores múltiples
        // como "Matemáticas, Inglés" sin depender de matching exacto en backend.
        if (searchTerm) {
          filters.search = searchTerm
        }

        const data = await teachersService.getTeachers(filters)

        if (currentRequestId !== requestIdRef.current) {
          return
        }

        // Mostrar solo datos reales del backend (normalizados en el service).
        const normalizedTeachers = (Array.isArray(data) ? data : []).map(normalizeTeacher)
        setTeachers(normalizedTeachers)
        teachersCache.set(cacheKey, normalizedTeachers)
        hasLoadedOnceRef.current = true
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return
        }
        console.error('Error fetching teachers:', error)
        setTeachers([])
        setError(error.message || 'No se pudieron cargar los profesores. Inténtalo de nuevo en unos segundos.')
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    // Debounce de búsqueda
    const timer = setTimeout(() => {
      fetchTeachers()
    }, 500)

    return () => clearTimeout(timer)
  }, [filterSubject, searchTerm])

  // Filtrado local de profesores (respaldo)
  const filteredTeachers = teachers.filter(teacher => {
    const teacherName = teacher?.name ?? ''
    const teacherBio = teacher?.bio ?? ''
    const teacherSubject = teacher?.subject ?? ''
    const normalizedSearchTerm = normalizeText(searchTerm)
    const normalizedFilterSubject = normalizeText(filterSubject)

    const matchesSearch =
      normalizeText(teacherName).includes(normalizedSearchTerm) ||
      normalizeText(teacherBio).includes(normalizedSearchTerm) ||
      normalizeText(teacherSubject).includes(normalizedSearchTerm)

    const teacherSubjects = Array.isArray(teacherSubject)
      ? teacherSubject.map((item) => normalizeText(item))
      : String(teacherSubject)
          .split(',')
          .map((item) => normalizeText(item))
          .filter(Boolean)

    const matchesSubject =
      filterSubject === 'todas' || teacherSubjects.includes(normalizedFilterSubject)

    return matchesSearch && matchesSubject
  })

  const handleContactTeacher = (teacherId) => {
    navigate(`/teachers/${teacherId}`)
  }

  return (
    <AuthLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            👨‍🏫 Buscar Profesores
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Encuentra los mejores profesores para tus necesidades
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Buscar profesor
              </label>
              <input
                type="text"
                placeholder="Nombre, asignatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter by Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Asignatura
              </label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="todas">Todas las asignaturas</option>
                <option value="Matemáticas">Matemáticas</option>
                <option value="Programación">Programación</option>
                <option value="Inglés">Inglés</option>
                <option value="Historia">Historia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        {isRefreshing && teachers.length > 0 && (
          <div className="mb-4 text-sm text-blue-600 dark:text-blue-400">
            Actualizando profesores...
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && teachers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando profesores...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-600 dark:text-red-400 text-lg mb-2">{error}</p>
              <p className="text-gray-600 dark:text-gray-400">No se muestran datos de prueba para estudiantes.</p>
            </div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-shadow"
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl mb-4 overflow-hidden">
                  {teacher.avatar_url ? (
                    <img
                      src={teacher.avatar_url}
                      alt={teacher.name || 'Profesor'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{teacher.image || '👨‍🏫'}</span>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {teacher.name}
                </h3>
                
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-2">
                  {teacher.subject || 'Sin asignatura especificada'}
                </p>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {teacher.bio || 'Este profesor aún no ha añadido una biografía.'}
                </p>

                {/* Rating and Students */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {teacher.rating ?? 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {(teacher.students_count ?? teacher.students ?? 0)} estudiantes
                  </span>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {teacher.price_per_hour ?? teacher.price ?? 'Precio no disponible'}
                  </span>
                  <button 
                    onClick={() => handleContactTeacher(teacher.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No se encontraron profesores
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
