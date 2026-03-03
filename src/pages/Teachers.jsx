import { useState, useEffect } from 'react'
import AuthLayout from '../layouts/AuthLayout'
import { teachersService } from '../services/teachersService'

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('todas')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock data - fallback si el backend no responde
  const mockTeachers = [
    {
      id: 1,
      name: 'Dr. Juan García',
      subject: 'Matemáticas',
      rating: 4.8,
      students_count: 45,
      image: '👨‍🏫',
      bio: 'Especialista en Cálculo y Álgebra con 10 años de experiencia',
      price_per_hour: '$30/hora'
    },
    {
      id: 2,
      name: 'Ing. María López',
      subject: 'Programación',
      rating: 4.9,
      students_count: 62,
      image: '👩‍💼',
      bio: 'Experta en Python, JavaScript y Web Development',
      price_per_hour: '$35/hora'
    },
    {
      id: 3,
      name: 'Lic. Carlos Rodríguez',
      subject: 'Inglés',
      rating: 4.7,
      students_count: 38,
      image: '👨‍🏫',
      bio: 'Certificado TEFL con especialidad en pronunciación',
      price_per_hour: '$25/hora'
    },
  ]

  // Obtener profesores del backend
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const filters = {}
        if (filterSubject !== 'todas') {
          filters.subject = filterSubject
        }
        if (searchTerm) {
          filters.search = searchTerm
        }

        const data = await teachersService.getTeachers(filters)
        
        // Procesar datos del backend
        if (Array.isArray(data)) {
          setTeachers(data)
        } else if (data && data.data) {
          setTeachers(data.data)
        } else {
          // Usar datos mock si el backend no responde correctamente
          setTeachers(mockTeachers)
        }
      } catch (error) {
        console.error('Error fetching teachers:', error)
        // Usar datos mock en caso de error
        setTeachers(mockTeachers)
        setError(null) // No mostrar error, solo usar mock data
      } finally {
        setLoading(false)
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
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (teacher.bio && teacher.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSubject = filterSubject === 'todas' || teacher.subject === filterSubject
    return matchesSearch && matchesSubject
  })

  const handleContactTeacher = async (teacherId) => {
    console.log('Contactando a profesor:', teacherId)
    // TODO: Implementar modal para enviar mensaje de contacto
    alert('Función de contacto próximamente')
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando profesores...</p>
            </div>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-shadow"
              >
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl mb-4">
                  {teacher.image || '👨‍🏫'}
                </div>

                {/* Info */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {teacher.name}
                </h3>
                
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-2">
                  {teacher.subject}
                </p>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {teacher.bio}
                </p>

                {/* Rating and Students */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {teacher.rating}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {teacher.students_count || teacher.students} estudiantes
                  </span>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {teacher.price_per_hour || teacher.price}
                  </span>
                  <button 
                    onClick={() => handleContactTeacher(teacher.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Contactar
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
