import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import { profileService } from '../services/profileService'

export default function Profile() {
  const { user, updateUserRole } = useAuth()
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [loadingTeacher, setLoadingTeacher] = useState(false)
  const [teacherData, setTeacherData] = useState({
    subjects: [], // Cambiado a array para múltiples materias
    bio: '',
    price_per_hour: '',
  })
  const [certificateFile, setCertificateFile] = useState(null)

  // Lista de materias disponibles
  const availableSubjects = [
    'Matemáticas',
    'Programación',
    'Inglés',
    'Historia',
    'Ciencias',
    'Diseño',
    'Física',
    'Química',
    'Literatura',
    'Arte'
  ]

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de archivo (solo PDF)
      const validTypes = ['application/pdf']
      const isValidType = validTypes.includes(file.type)
      const isValidExtension = file.name.toLowerCase().endsWith('.pdf')
      
      if (!isValidType && !isValidExtension) {
        alert('Por favor sube solo archivos PDF')
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB')
        return
      }
      
      setCertificateFile(file)
    }
  }

  // Función para manejar la selección/deselección de materias
  const handleSubjectToggle = (subject) => {
    setTeacherData(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject) // Remover si ya está
        : [...prev.subjects, subject] // Agregar si no está
      return { ...prev, subjects }
    })
  }

  const handleBecomeTeacher = async () => {
    if (!teacherData.subjects || teacherData.subjects.length === 0 || !teacherData.bio || teacherData.bio.trim().length === 0) {
      alert('Por favor selecciona al menos una materia y escribe tu biografía')
      return
    }

    if (!certificateFile) {
      alert('Por favor sube tu título o curriculum para verificación')
      return
    }

    try {
      setLoadingTeacher(true)
      const result = await profileService.becomeTeacher(teacherData, certificateFile)
      
      if (result.data?.user) {
        if (result.data.user.role === 'teacher') {
          updateUserRole('teacher')
          alert('✅ ¡Felicidades! Tu solicitud fue aprobada. Ahora eres un profesor')
        } else if (result.data.user.teacher_status === 'pending') {
          updateUserRole('pending_teacher')
          alert('📋 Tu solicitud ha sido enviada. Será revisada por nuestro equipo.')
        }
        setShowTeacherForm(false)
        setTeacherData({ subjects: [], bio: '', price_per_hour: '' })
        setCertificateFile(null)
      }
    } catch (error) {
      console.error('Error becoming teacher:', error)
      
      // Normalizar el mensaje de error para evitar errores con undefined
      const msg = String(error?.message ?? error ?? '')
      
      // Verificar si es error 404 (endpoint no implementado)
      if (msg.includes('404') || msg.includes('Not Found')) {
        alert('⚠️ El sistema de solicitudes de profesores aún no está implementado en el backend.\n\nPor favor, implementa el endpoint POST /api/become-teacher en Laravel siguiendo las especificaciones proporcionadas.')
      } else {
        alert('Error al convertirse en profesor: ' + msg)
      }
    } finally {
      setLoadingTeacher(false)
    }
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl shadow-lg">
                👤
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name || 'Usuario'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user?.email}
                </p>
              </div>
            </div>
            
            {/* Edit Button */}
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Banner de verificación pendiente */}
        {(user?.teacher_status === 'pending' || user?.role === 'pending_teacher') && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                  Solicitud de Profesor en Revisión
                </h3>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  Tu solicitud para convertirte en profesor está siendo revisada por nuestro equipo. 
                  Te notificaremos por email cuando sea aprobada. Esto puede tomar entre 24-48 horas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Información Personal */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Información Personal
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Nombre Completo</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white font-medium">{user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Tipo de Usuario</label>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.role === 'teacher' ? '👨‍🏫 Profesor' : '👨‍🎓 Estudiante'}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📊 Estadísticas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tareas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conexiones</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Intereses */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⭐ Tus Intereses
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Selecciona tus intereses para recibir contenido personalizado
          </p>
          <div className="flex flex-wrap gap-2">
            {['Programación', 'Matemáticas', 'Inglés', 'Historia', 'Ciencias', 'Diseño'].map((interest) => (
              <button
                key={interest}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Sección para convertirse en profesor - Solo si no es profesor Y no tiene solicitud pendiente */}
        {user?.role !== 'teacher' && user?.role !== 'pending_teacher' && user?.teacher_status !== 'pending' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-8">
            <div className="flex items-start gap-4">
              <div className="text-5xl">👨‍🏫</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¿Quieres ser Profesor?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comparte tus conocimientos con otros estudiantes. Los profesores pueden crear cursos, establecer sus propios precios y ganar dinero.
                </p>

                {!showTeacherForm ? (
                  <button
                    onClick={() => setShowTeacherForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Comenzar a enseñar
                  </button>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Información del Profesor
                    </h3>

                    {/* Subjects - Multiple Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Materias que enseñas * (selecciona una o varias)
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {availableSubjects.map((subject) => (
                          <label
                            key={subject}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={teacherData.subjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {subject}
                            </span>
                          </label>
                        ))}
                      </div>
                      {teacherData.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {teacherData.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Biografía (Cuéntanos sobre ti) *
                      </label>
                      <textarea
                        value={teacherData.bio}
                        onChange={(e) =>
                          setTeacherData({ ...teacherData, bio: e.target.value })
                        }
                        placeholder="Ej: Soy ingeniero con 10 años de experiencia en Python..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                        rows="4"
                      />
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Precio por hora (opcional)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={teacherData.price_per_hour}
                          onChange={(e) =>
                            setTeacherData({ ...teacherData, price_per_hour: e.target.value })
                          }
                          placeholder="30"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <span className="text-gray-600 dark:text-gray-400">/hora</span>
                      </div>
                    </div>

                    {/* Certificate/CV Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Título o Curriculum * 📄
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Sube tu título universitario, certificado o CV para verificación (Solo PDF - Máx 5MB)
                      </p>
                      
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          id="certificate"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="certificate"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {!certificateFile ? (
                            <>
                              <div className="text-4xl mb-2">📁</div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                                Click para subir archivo
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Solo PDF (máx 5MB)
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="text-4xl mb-2">✅</div>
                              <p className="text-green-600 dark:text-green-400 font-medium mb-1">
                                {certificateFile.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {(certificateFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCertificateFile(null)
                                }}
                                className="text-xs text-red-600 dark:text-red-400 mt-2 hover:underline"
                              >
                                Eliminar archivo
                              </button>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleBecomeTeacher}
                        disabled={loadingTeacher}
                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingTeacher ? 'Enviando...' : 'Enviar Solicitud'}
                      </button>
                      <button
                        onClick={() => {
                          setShowTeacherForm(false)
                          setTeacherData({ subjects: [], bio: '', price_per_hour: '' })
                          setCertificateFile(null)
                        }}
                        className="flex-1 px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                      ⚠️ Tu solicitud será revisada por nuestro equipo. Te notificaremos por email cuando sea aprobada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
