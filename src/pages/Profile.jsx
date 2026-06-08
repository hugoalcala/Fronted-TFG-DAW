import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import { profileService } from '../services/profileService'

// Lista de intereses disponibles
const AVAILABLE_INTERESTS = [
  'Programación',
  'Matemáticas',
  'Inglés',
  'Historia',
  'Ciencias',
  'Diseño',
  'Física',
  'Química',
  'Literatura',
  'Arte',
  'Música',
  'Deportes',
  'Negocios',
  'Marketing',
  'Desarrollo Web',
  'Base de Datos'
]

// Lista de materias disponibles
const AVAILABLE_SUBJECTS = [
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

export default function Profile() {
  const { user, updateUserRole, setUser } = useAuth()
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [loadingTeacher, setLoadingTeacher] = useState(false)
  const [teacherData, setTeacherData] = useState({
    subjects: [], // Cambiado a array para múltiples materias
    bio: '',
    price_per_hour: '',
  })
  const [certificateFile, setCertificateFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Estados para edición de perfil
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    price_per_hour: '',
  })
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [showConfirmNameChange, setShowConfirmNameChange] = useState(false)
  const [pendingNameChange, setPendingNameChange] = useState(null)
  const [userInterests, setUserInterests] = useState([])
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [loadingInterests, setLoadingInterests] = useState(false)
  const modalRef = useRef(null)
  const firstInputRef = useRef(null)
  const previousFocusedElementRef = useRef(null)

  // Lista de materias disponibles
  const availableSubjects = useMemo(() => AVAILABLE_SUBJECTS, [])

  const validateAndSetCertificate = async (file) => {
    if (!file) return

    const validTypes = ['application/pdf']
    const isValidType = validTypes.includes(file.type)
    const isValidExtension = file.name.toLowerCase().endsWith('.pdf')

    if (!isValidType && !isValidExtension) {
      alert('Por favor sube solo archivos PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB')
      return
    }

    try {
      const arrayBuffer = await file.slice(0, 5).arrayBuffer()
      const header = new Uint8Array(arrayBuffer)
      const isPDFSignature =
        header[0] === 0x25 &&
        header[1] === 0x50 &&
        header[2] === 0x44 &&
        header[3] === 0x46 &&
        header[4] === 0x2D

      if (!isPDFSignature) {
        alert('El archivo no es un PDF válido. Por favor sube un archivo PDF real.')
        return
      }
    } catch (error) {
      console.error('Error validando archivo:', error)
      alert('Error al validar el archivo. Por favor intenta de nuevo.')
      return
    }

    setCertificateFile(file)
  }

  const handleFileChange = async (e) => {
    await validateAndSetCertificate(e.target.files[0])
  }

  const handleCertificateDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    await validateAndSetCertificate(file)
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

  const handleOpenEditModal = () => {
    setEditData({
      name: user?.name ?? '',
      email: user?.email ?? '',
      price_per_hour: user?.price_per_hour ?? '',
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(false)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(false)
  }

  // Cargar intereses del usuario
  useEffect(() => {
    if (user?.interests) {
      if (Array.isArray(user.interests)) {
        // Si son objetos con id, name, description - extraer solo los nombres
        const interestNames = user.interests.map(interest => 
          typeof interest === 'string' ? interest : interest.name
        )
        setUserInterests(interestNames)
      } else {
        setUserInterests([])
      }
    }
  }, [user])

  const handleToggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest)
      } else {
        return [...prev, interest]
      }
    })
  }

  const handleSaveInterests = async () => {
    try {
      setLoadingInterests(true)
      const response = await profileService.updateInterests(selectedInterests)
      
      // Si la respuesta devuelve los intereses actualizados, usarlos
      let interestNames = selectedInterests
      if (Array.isArray(response)) {
        // Si la respuesta es un array directamente
        interestNames = response.map(interest => 
          typeof interest === 'string' ? interest : interest.name
        )
      } else if (response?.interests && Array.isArray(response.interests)) {
        // Si la respuesta es un objeto con clave interests
        interestNames = response.interests.map(interest => 
          typeof interest === 'string' ? interest : interest.name
        )
      }
      
      setUserInterests(interestNames)
      
      // Actualizar el usuario en el contexto con los intereses como nombres
      if (user) {
        setUser({ ...user, interests: interestNames })
      }
      
      alert('✅ Intereses guardados exitosamente')
      setIsEditingInterests(false) // Cerrar el modal
    } catch (error) {
      console.error('Error saving interests:', error)
      alert('Error al guardar intereses: ' + error.message)
    } finally {
      setLoadingInterests(false)
    }
  }

  useEffect(() => {
    if (!showEditModal) {
      return undefined
    }

    previousFocusedElementRef.current = document.activeElement

    const focusTimer = setTimeout(() => {
      firstInputRef.current?.focus()
    }, 0)

    const handleModalKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleCloseEditModal()
        return
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return
      }

      const focusableElements = modalRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements.length) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (activeElement === firstElement || !modalRef.current.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleModalKeydown)

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleModalKeydown)
      previousFocusedElementRef.current?.focus?.()
    }
  }, [showEditModal])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tipo de archivo (solo imágenes)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Por favor sube solo imágenes (JPEG, PNG, GIF, WebP)')
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB')
        return
      }
      
      setRemoveAvatar(false)
      setAvatarFile(file)
      
      // Crear vista previa
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.onerror = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
        alert('No se pudo leer la imagen seleccionada. Intenta con otro archivo.')
      }
      reader.onabort = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    const normalizedName = (editData.name ?? '').trim()

    if (!normalizedName) {
      alert('Por favor completa el nombre')
      return
    }

    if (normalizedName !== editData.name) {
      setEditData((prev) => ({ ...prev, name: normalizedName }))
    }

    // Verificar si el nombre fue cambiado
    const nameWasChanged = normalizedName !== (user?.name ?? '')
    if (nameWasChanged) {
      setPendingNameChange(normalizedName)
      setShowConfirmNameChange(true)
      return
    }

    // Si el nombre no cambió, continuar con el guardado normal
    await performProfileSave(normalizedName)
  }

  const handleConfirmNameChange = async () => {
    setShowConfirmNameChange(false)
    await performProfileSave(pendingNameChange)
    setPendingNameChange(null)
  }

  const handleCancelNameChange = () => {
    setShowConfirmNameChange(false)
    setPendingNameChange(null)
  }

  const performProfileSave = async (normalizedName) => {

    const previousUser = user
    const refreshCanonicalUser = async () => {
      const refreshedProfile = await profileService.getProfile()
      const refreshedUser = refreshedProfile?.user ?? refreshedProfile
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    }

    try {
      setLoadingEdit(true)
      let failedStep = 'guardar los cambios del perfil'

      // Si el usuario eligió quitar su foto, restaurar avatar predeterminado
      if (removeAvatar) {
        failedStep = 'eliminar el avatar actual'
        await profileService.removeAvatar()
        await refreshCanonicalUser()
      }
      
      // Primero actualizar el avatar si hay uno nuevo
      if (avatarFile) {
        failedStep = 'subir la nueva imagen de perfil'
        await profileService.updateAvatar(avatarFile)
        await refreshCanonicalUser()
      }
      
      // Luego actualizar los datos del perfil (sin email)
      const updatePayload = {
        name: normalizedName,
      }

      // Solo incluir precio si el usuario es profesor
      if (user?.role === 'teacher') {
        const rawPrice = editData.price_per_hour
        const isEmptyPrice = rawPrice === '' || rawPrice === null || rawPrice === undefined

        if (isEmptyPrice) {
          updatePayload.price_per_hour = null
        } else {
          const parsedPrice = Number(rawPrice)
          if (!Number.isFinite(parsedPrice)) {
            alert('El precio por hora debe ser un número válido')
            return
          }
          updatePayload.price_per_hour = parsedPrice
        }
      }

      failedStep = 'actualizar los datos del perfil'
      await profileService.updateProfile(updatePayload)
      await refreshCanonicalUser()

      alert('✅ Perfil actualizado exitosamente')
      handleCloseEditModal()
    } catch (error) {
      console.error('Error updating profile:', error)

      // Evitar UI inconsistente: intentar reflejar estado real del backend.
      try {
        await refreshCanonicalUser()
      } catch (refreshError) {
        console.warn('No se pudo refrescar el estado canónico tras error:', refreshError)
        if (previousUser) {
          setUser(previousUser)
        }
      }

      alert(`Error al ${failedStep}: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoadingEdit(false)
    }
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl shadow-lg overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>

              {/* User Info */}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {user?.name || 'Usuario'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={handleOpenEditModal}
              className="self-start sm:self-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            >
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
               Información Personal
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
                  {user?.role === 'teacher' ? ' Profesor' : ' Estudiante'}
                </p>
              </div>
              {/* Mostrar precio solo si es profesor */}
              {user?.role === 'teacher' && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Precio por hora</label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user?.price_per_hour !== null && user?.price_per_hour !== undefined && user?.price_per_hour !== ''
                      ? `$${user.price_per_hour}/hora`
                      : 'No especificado'}
                  </p>
                </div>
              )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
               Tus Intereses
            </h2>
            {!isEditingInterests && (
              <button
                onClick={() => {
                  setSelectedInterests(userInterests || [])
                  setIsEditingInterests(true)
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Editar
              </button>
            )}
          </div>
          
          {!isEditingInterests ? (
            // Vista de lectura
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Selecciona tus intereses para recibir contenido personalizado
              </p>
              {userInterests && userInterests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No has seleccionado intereses aún
                </p>
              )}
            </>
          ) : (
            // Vista de edición
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Selecciona uno o más intereses:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(interest)}
                      onChange={() => handleToggleInterest(interest)}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-900 dark:text-white">
                      {interest}
                    </span>
                  </label>
                ))}
              </div>
              
              {selectedInterests && selectedInterests.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-medium">{selectedInterests.length}</span> interés{selectedInterests.length !== 1 ? 'es' : ''} seleccionado{selectedInterests.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveInterests}
                  disabled={loadingInterests}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingInterests ? 'Guardando...' : 'Guardar Intereses'}
                </button>
                <button
                  onClick={() => setIsEditingInterests(false)}
                  disabled={loadingInterests}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal de Confirmación de Cambio de Nombre */}
        {showConfirmNameChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-name-title"
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-800"
            >
              <h2 id="confirm-name-title" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Cambiar tu nombre?
              </h2>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nombre actual:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {user?.name}
                </p>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nuevo nombre:</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {pendingNameChange}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Esta acción no se puede deshacer. ¿Deseas continuar?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmNameChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Confirmar
                </button>
                <button
                  onClick={handleCancelNameChange}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición de Perfil */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-profile-title"
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800"
            >
              <h2 id="edit-profile-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Editar Perfil
              </h2>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Nombre *
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Tu nombre completo"
                  />
                </div>

                {/* Email - Solo lectura */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    El email no se puede cambiar por motivos de seguridad
                  </p>
                </div>

                {/* Foto de perfil */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Foto de perfil 📸
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Vista previa del avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-3xl shadow-lg overflow-hidden flex-shrink-0">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : removeAvatar ? (
                        <span>👤</span>
                      ) : user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    
                    {/* Input de archivo */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          {avatarFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                        </label>

                        {(user?.avatar_url || avatarPreview || removeAvatar) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (removeAvatar) {
                                setRemoveAvatar(false)
                              } else {
                                setAvatarFile(null)
                                setAvatarPreview(null)
                                setRemoveAvatar(true)
                              }
                            }}
                            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              removeAvatar
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {removeAvatar ? 'Restaurar foto anterior' : 'Usar avatar predeterminado'}
                          </button>
                        )}

                        {avatarFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarFile(null)
                              setAvatarPreview(null)
                            }}
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Quitar imagen nueva
                          </button>
                        )}
                      </div>

                      {removeAvatar && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          Al guardar, se eliminará tu foto actual y se usará el avatar por defecto.
                        </p>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, PNG, GIF o WebP (máx 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Precio por hora - Solo para profesores */}
                {user?.role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Precio por hora 
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">$</span>
                      <input
                        type="number"
                        value={editData.price_per_hour}
                        onChange={(e) => setEditData({ ...editData, price_per_hour: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="30"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-600 dark:text-gray-400">/hora</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Este es el precio que cobrarás por tus clases
                    </p>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={loadingEdit}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={handleCloseEditModal}
                  disabled={loadingEdit}
                  className="flex-1 px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Cambio de Nombre */}
        {showConfirmNameChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-name-change-title"
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              
              <h2 id="confirm-name-change-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Confirmar cambio de nombre
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                ¿Estás seguro de que quieres cambiar tu nombre de <span className="font-medium text-gray-900 dark:text-white">"{user?.name}"</span> a <span className="font-medium text-gray-900 dark:text-white">"{pendingNameChange}"</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmNameChange}
                  disabled={loadingEdit}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingEdit ? 'Guardando...' : 'Sí, cambiar nombre'}
                </button>
                <button
                  onClick={handleCancelNameChange}
                  disabled={loadingEdit}
                  className="flex-1 px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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
                      
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleCertificateDrop}
                      >
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
