import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { teachersService } from '../services/teachersService'
import { ratingsService } from '../services/ratingsService'
import { messagesService } from '../services/messagesService'
import { normalizeTeacher } from '../utils/teacherUtils'

export default function TeacherProfile() {
  const { id: teacherId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const requestIdRef = useRef(0)

  const [teacher, setTeacher] = useState(null)
  const [ratings, setRatings] = useState([])
  const [averageRating, setAverageRating] = useState(null)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados para la reseña
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [studentRating, setStudentRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [reviewSuccessType, setReviewSuccessType] = useState(null) // 'created' | 'edited' | 'deleted'
  const reviewSuccessTimerRef = useRef(null)

  // Estados para editar y eliminar reseñas
  const [editingRatingId, setEditingRatingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(5)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deletingRatingId, setDeletingRatingId] = useState(null)
  const [deletingErrors, setDeletingErrors] = useState({})
  const [openMenuRatingId, setOpenMenuRatingId] = useState(null)
  const [reportingRatingId, setReportingRatingId] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportError, setReportError] = useState(null)

  // Cargar datos del profesor
  useEffect(() => {
    const loadTeacherData = async () => {
      const currentRequestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)
        console.log('📍 Loading teacher profile for ID:', teacherId)
        
        let teacherData = null
        let ratingsData = null

        // Intenta obtener datos directamente del endpoint /teachers/:id
        try {
          teacherData = await ratingsService.getTeacherDetails(teacherId)
          // Obtener ratings pero no fallar si no se puede
          try {
            ratingsData = await ratingsService.getTeacherRatings(teacherId)
          } catch (ratingsErr) {
            console.warn('⚠️ Could not load ratings:', ratingsErr.message)
            ratingsData = { ratings: [], average: null, total_count: 0 }
          }
        } catch (err) {
          console.warn('⚠️ getTeacherDetails failed, trying alternative:', err.message)
          
          // Fallback: obtener del listado general de profesores
          try {
            const allTeachers = await teachersService.getTeachers({})
            const found = allTeachers.find((t) => String(t.id) === String(teacherId))
            if (found) {
              teacherData = found
              console.log('✅ Found teacher in list:', found)
            }
          } catch (fallbackErr) {
            console.error('❌ Fallback also failed:', fallbackErr)
          }

          // Intentar cargar ratings de todas formas
          if (!ratingsData) {
            try {
              ratingsData = await ratingsService.getTeacherRatings(teacherId)
            } catch (err2) {
              console.warn('⚠️ Could not load ratings:', err2.message)
              ratingsData = { ratings: [], average: null, total_count: 0 }
            }
          }
        }

        // Proteger contra respuestas obsoletas
        if (currentRequestId !== requestIdRef.current) {
          console.warn('⚠️ Newer request already in progress, ignoring stale response')
          return
        }

        if (!teacherData) {
          throw new Error('No se pudo cargar la información del profesor')
        }

        const normalizedTeacher = normalizeTeacher(teacherData)
        setTeacher(normalizedTeacher)
        
        // Procesar ratings - puede ser array directo o objeto con propiedades
        const ratingsArray = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.ratings || [])
        const average = typeof ratingsData?.average === 'number' ? ratingsData.average : null
        const totalCount = typeof ratingsData?.total_count === 'number' ? ratingsData.total_count : ratingsArray.length
        
        setRatings(ratingsArray)
        setAverageRating(average)
        setTotalReviews(totalCount)
      } catch (err) {
        console.error('❌ Error loading teacher:', err)
        if (currentRequestId === requestIdRef.current) {
          setError(err.message || 'No se pudo cargar el perfil del profesor')
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }

    loadTeacherData()
  }, [teacherId])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
    }
  }, [])

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setStudentRating(i)}
          aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
          aria-pressed={i === rating}
          className={`text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      )
    }
    return stars
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    // Guardia temprana para evitar duplicados
    if (submittingReview) return
    
    // Validar que haya estrellas seleccionadas
    if (!studentRating || studentRating < 1) {
      setReviewError('Por favor selecciona una calificación de estrellas')
      return
    }

    // El comentario es opcional, pero si lo hay, se incluye
    const reviewPayload = {
      rating: studentRating,
    }
    
    if (reviewText.trim()) {
      reviewPayload.review = reviewText.trim()
    }

    setSubmittingReview(true)
    setReviewError(null)

    try {
      await ratingsService.createRating(teacherId, reviewPayload)

      // Recargar ratings primero
      const ratingsData = await ratingsService.getTeacherRatings(teacherId)
      const ratingsArray = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.ratings || [])
      const average = typeof ratingsData?.average === 'number' ? ratingsData.average : null
      const totalCount = typeof ratingsData?.total_count === 'number' ? ratingsData.total_count : ratingsArray.length
      
      setRatings(ratingsArray)
      setAverageRating(average)
      setTotalReviews(totalCount)

      // Solo después de éxito, mostrar feedback y cerrar formulario
      setReviewSuccessType('created')
      setReviewText('')
      setStudentRating(5)
      setShowReviewForm(false)

      // Limpiar timeout anterior si existe
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      // Crear nuevo timeout y guardar su ID
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccessType(null), 5000)
    } catch (err) {
      console.error('Error creating review:', err)
      setReviewError(err.message || 'Error al enviar la reseña')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleEditRating = (rating) => {
    setEditingRatingId(rating.id)
    setEditText(rating.review || '')
    setEditRating(rating.rating || 5)
    setEditError(null)
  }

  const handleCancelEdit = () => {
    setEditingRatingId(null)
    setEditText('')
    setEditRating(5)
    setEditError(null)
  }

  const handleUpdateRating = async (ratingId) => {
    if (submittingEdit) return

    // Validar que haya estrellas
    if (!editRating || editRating < 1) {
      setEditError('Por favor selecciona una calificación de estrellas')
      return
    }

    const updatePayload = {
      rating: editRating,
    }

    if (editText.trim()) {
      updatePayload.review = editText.trim()
    }

    setSubmittingEdit(true)
    setEditError(null)

    try {
      await ratingsService.updateRating(teacherId, ratingId, updatePayload)

      // Recargar ratings
      const ratingsData = await ratingsService.getTeacherRatings(teacherId)
      const ratingsArray = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.ratings || [])
      const average = typeof ratingsData?.average === 'number' ? ratingsData.average : null
      const totalCount = typeof ratingsData?.total_count === 'number' ? ratingsData.total_count : ratingsArray.length
      
      setRatings(ratingsArray)
      setAverageRating(average)
      setTotalReviews(totalCount)

      setEditingRatingId(null)
      setEditText('')
      setEditRating(5)
      setReviewSuccessType('edited')
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccessType(null), 5000)
    } catch (err) {
      console.error('Error updating rating:', err)
      setEditError(err.message || 'Error al actualizar la reseña')
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña?')) {
      return
    }

    setDeletingRatingId(ratingId)
    setOpenMenuRatingId(null)
    setDeletingErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[ratingId]
      return newErrors
    })

    try {
      await ratingsService.deleteRating(teacherId, ratingId)

      // Recargar ratings
      const ratingsData = await ratingsService.getTeacherRatings(teacherId)
      const ratingsArray = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.ratings || [])
      const average = typeof ratingsData?.average === 'number' ? ratingsData.average : null
      const totalCount = typeof ratingsData?.total_count === 'number' ? ratingsData.total_count : ratingsArray.length
      
      setRatings(ratingsArray)
      setAverageRating(average)
      setTotalReviews(totalCount)

      setReviewSuccessType('deleted')
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccessType(null), 5000)
    } catch (err) {
      console.error('Error deleting rating:', err)
      setDeletingErrors(prev => ({
        ...prev,
        [ratingId]: err.message || 'Error al eliminar la reseña'
      }))
    } finally {
      setDeletingRatingId(null)
    }
  }

  const handleReportRating = (ratingId) => {
    setReportingRatingId(ratingId)
    setOpenMenuRatingId(null)
    setShowReportModal(true)
    setReportReason('')
    setReportDetails('')
    setReportError(null)
  }

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      setReportError('Por favor selecciona una razón para la denuncia')
      return
    }

    setSubmittingReport(true)
    setReportError(null)

    try {
      await ratingsService.reportRating(teacherId, reportingRatingId, {
        reason: reportReason,
        details: reportDetails.trim(),
      })

      // Mostrar éxito y cerrar modal
      setReviewSuccessType('reported')
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccessType(null), 5000)
      
      setShowReportModal(false)
      setReportingRatingId(null)
    } catch (err) {
      console.error('Error reporting rating:', err)
      setReportError(err.message || 'Error al enviar la denuncia')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleCancelReport = () => {
    setShowReportModal(false)
    setReportingRatingId(null)
    setReportReason('')
    setReportDetails('')
    setReportError(null)
  }

  const handleOpenReportMenu = (ratingId) => {
    setReportingRatingId(ratingId)
    setOpenMenuRatingId(null)
    setShowReportModal(true)
    setReportReason('')
    setReportDetails('')
    setReportError(null)
  }

  const handleContactTeacher = async () => {
    try {
      // Intenta obtener conversaciones existentes
      const conversations = await messagesService.getConversations()
      
      // Buscar si ya existe una conversación con este profesor
      const existingConversation = conversations.find(
        (conv) => String(conv.recipient_id) === String(teacherId) || String(conv.user_id) === String(teacherId)
      )

      if (existingConversation) {
        navigate(`/messages?conversation=${existingConversation.id}`)
      } else {
        // Si no existe, navega a mensajes y crea una nueva
        navigate(`/messages?newChat=${teacherId}`)
      }
    } catch (err) {
      console.error('Error opening message:', err)
      navigate('/messages')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando perfil del profesor...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (error || !teacher) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || 'No se encontró el profesor'}</p>
            <button
              onClick={() => navigate('/teachers')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a profesores
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver */}
        <button
          onClick={() => navigate('/teachers')}
          className="mb-6 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          ← Volver a profesores
        </button>

        {/* Notificaciones - Toast Flotante */}
        {reviewSuccessType && (
          <div className={`fixed top-4 right-4 z-50 animate-bounce max-w-sm ${
            reviewSuccessType === 'reported'
              ? 'bg-gradient-to-r from-orange-400 to-orange-600'
              : 'bg-gradient-to-r from-green-400 to-green-600'
          } text-white p-4 rounded-xl shadow-2xl border-2 ${
            reviewSuccessType === 'reported'
              ? 'border-orange-200'
              : 'border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {reviewSuccessType === 'reported' ? '🚩' : '✅'}
              </span>
              <div>
                <p className="font-bold text-lg">
                  {reviewSuccessType === 'created' && '¡Reseña enviada!'}
                  {reviewSuccessType === 'edited' && '¡Reseña actualizada!'}
                  {reviewSuccessType === 'deleted' && '¡Reseña eliminada!'}
                  {reviewSuccessType === 'reported' && '¡Denuncia enviada!'}
                </p>
                <p className="text-sm opacity-90">
                  {reviewSuccessType === 'created' && 'Tu reseña ha sido publicada con éxito'}
                  {reviewSuccessType === 'edited' && 'Tu reseña se ha actualizado correctamente'}
                  {reviewSuccessType === 'deleted' && 'Tu reseña ha sido eliminada'}
                  {reviewSuccessType === 'reported' && 'Nuestro equipo revisará la denuncia pronto'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de denuncia */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Encabezado */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  🚩 Denunciar reseña
                </h2>
                <p className="text-sm text-orange-100 mt-1">Ayudanos a mantener una comunidad segura</p>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-4">
                {reportError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                    ⚠️ {reportError}
                  </div>
                )}

                {/* Razón de denuncia */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                    ¿Cuál es el motivo de la denuncia?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'offensive_content', label: 'Contenido ofensivo o faltas de respeto' },
                      { value: 'spam', label: 'Spam o contenido irrelevante' },
                      { value: 'fake_review', label: 'Reseña falsa o engañosa' },
                      { value: 'inappropriate', label: 'Contenido inapropiado' },
                      { value: 'other', label: 'Otro motivo' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="report-reason"
                          value={option.value}
                          checked={reportReason === option.value}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Detalles adicionales (opcional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Proporciona más información que nos ayude a entender el problema..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo 500 caracteres
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 flex gap-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancelReport}
                  disabled={submittingReport}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={submittingReport}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReport ? '⏳ Enviando...' : '🚩 Denunciar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header del Profesor */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-6xl mb-4 overflow-hidden border-4 border-blue-200 dark:border-blue-800">
                {teacher.avatar_url ? (
                  <img
                    src={teacher.avatar_url}
                    alt={teacher.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  '👨‍🏫'
                )}
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-3">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {teacher.name}
              </h1>

              {/* Asignatura */}
              <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-4">
                📚 {teacher.subject || 'Sin asignatura especificada'}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">⭐</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageRating ? averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {teacher.students_count ?? 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Precio/hora</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {teacher.price_per_hour ? `$${teacher.price_per_hour}` : 'Verificar'}
                  </p>
                </div>
              </div>

              {/* Experiencia */}
              {teacher.experience_years && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  💼 {teacher.experience_years} años de experiencia
                </p>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-4">
                <button
                  onClick={handleContactTeacher}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  💬 Enviar mensaje
                </button>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  ⭐ Dejar reseña
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          {teacher.bio && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Sobre este profesor
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {teacher.bio}
              </p>
            </div>
          )}

          {/* Educación */}
          {teacher.education && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Educación
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {teacher.education}
              </p>
            </div>
          )}
        </div>

        {/* Formulario de Reseña */}
        {showReviewForm && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Dejar una reseña
            </h3>

            {reviewError && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              {/* Rating */}
              <div className="mb-8">
                <label 
                  id="rating-label"
                  className="block text-lg font-semibold text-gray-900 dark:text-white mb-4"
                >
                  Tu calificación <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Haz clic en una estrella para calificar (el comentario es opcional)
                </p>
                <div 
                  className="flex gap-3 mb-2"
                  role="radiogroup"
                  aria-labelledby="rating-label"
                >
                  {renderStars(studentRating)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Calificación seleccionada: <strong>{studentRating} {studentRating === 1 ? 'estrella' : 'estrellas'}</strong>
                </p>
              </div>

              {/* Texto de la reseña */}
              <div className="mb-8">
                <label 
                  htmlFor="review-text"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-3"
                >
                  Agrega un comentario <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">(completamente opcional)</span>
                </label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntale a otros estudiantes tu experiencia con este profesor..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  rows="4"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {reviewText.length} caracteres
                </p>
              </div>

              {/* Info de envío */}
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  💡 Puedes enviar solo tu calificación de estrellas sin escribir comentarios
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false)
                    setReviewText('')
                    setStudentRating(5)
                    setReviewError(null)
                  }}
                  className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reseñas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Reseñas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'} de estudiantes
          </p>

          {ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="group bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-200"
                >
                  {/* Editando reseña */}
                  {editingRatingId === rating.id ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="text-xl">✏️</span> Editar reseña
                        </h4>

                        {editError && (
                          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                            ⚠️ {editError}
                          </div>
                        )}

                        {/* Rating */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Tu calificación
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setEditRating(i)}
                                aria-label={`Estrella ${i} de 5`}
                                aria-pressed={i <= editRating}
                                className={`text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded ${
                                  i <= editRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comentario */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Comentario
                          </label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Comparte detalles sobre tu experiencia..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                          />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRating(rating.id)}
                            disabled={submittingEdit}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {submittingEdit ? '⏳ Guardando...' : '💾 Guardar cambios'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={submittingEdit}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Cabecera con menú */}
                      <div className="flex items-start justify-between mb-4 relative">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden border-3 border-blue-200 dark:border-blue-800 shadow-md">
                            {rating.student_avatar_url ? (
                              <img
                                src={rating.student_avatar_url}
                                alt={rating.student_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span>{(rating.student_name || 'E').charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Info del estudiante y rating */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-base">
                              {rating.student_name || 'Estudiante anónimo'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                               {rating.created_at
                                ? new Date(rating.created_at).toLocaleDateString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Recientemente'}
                            </p>
                            {/* Rating numérico con estrellas */}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                              </span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {rating.rating}/5
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botón de menú con tres puntos */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuRatingId(openMenuRatingId === rating.id ? null : rating.id)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Más opciones"
                          >
                            ⋯
                          </button>

                          {/* Menú desplegable */}
                          {openMenuRatingId === rating.id && (
                            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-max overflow-hidden">
                              {user?.id === rating.student_id ? (
                                <>
                                  <button
                                    onClick={() => handleEditRating(rating)}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors block"
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRating(rating.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors block border-t border-gray-200 dark:border-gray-700"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleReportRating(rating.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors block"
                                >
                                  🚩 Denunciar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Texto de la reseña */}
                      <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {rating.review ? (
                            <span className="italic">{rating.review}</span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Sin comentarios adicionales</span>
                          )}
                        </p>
                      </div>

                      {/* Estado de carga */}
                      {deletingRatingId === rating.id && (
                        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm border border-blue-200 dark:border-blue-800 text-center">
                          ⏳ Eliminando reseña...
                        </div>
                      )}

                      {deletingErrors[rating.id] && (
                        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm border border-red-200 dark:border-red-800">
                          ⚠️ {deletingErrors[rating.id]}
                        </div>
                      )}

                      {/* Cierra menú al hacer clic fuera */}
                      {openMenuRatingId === rating.id && (
                        <div
                          className="fixed inset-0 z-0"
                          onClick={() => setOpenMenuRatingId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-5xl mb-3">⭐</p>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                Aún no hay reseñas
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Sé el primero en dejar una reseña sobre este profesor
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
