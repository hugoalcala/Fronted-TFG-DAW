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
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const reviewSuccessTimerRef = useRef(null)

  // Estados para editar y eliminar reseñas
  const [editingRatingId, setEditingRatingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(5)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deletingRatingId, setDeletingRatingId] = useState(null)
  const [deletingError, setDeletingError] = useState(null)

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
        setRatings(ratingsData?.ratings || [])
        setAverageRating(ratingsData?.average || null)
        setTotalReviews(ratingsData?.total_count || 0)
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
      setRatings(ratingsData?.ratings || [])
      setAverageRating(ratingsData?.average || null)
      setTotalReviews(ratingsData?.total_count || 0)

      // Solo después de éxito, mostrar feedback y cerrar formulario
      setReviewSuccess(true)
      setReviewText('')
      setStudentRating(5)
      setShowReviewForm(false)

      // Limpiar timeout anterior si existe
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      // Crear nuevo timeout y guardar su ID
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccess(false), 3000)
    } catch (err) {
      console.error('Error creating review:', err)
      setReviewError(err.message || 'Error al enviar la reseña')
    } finally {
      if (submittingReview) {
        setSubmittingReview(false)
      }
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
      setRatings(ratingsData?.ratings || [])
      setAverageRating(ratingsData?.average || null)
      setTotalReviews(ratingsData?.total_count || 0)

      setEditingRatingId(null)
      setEditText('')
      setEditRating(5)
      setReviewSuccess(true)
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccess(false), 3000)
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
    setDeletingError(null)

    try {
      await ratingsService.deleteRating(teacherId, ratingId)

      // Recargar ratings
      const ratingsData = await ratingsService.getTeacherRatings(teacherId)
      setRatings(ratingsData?.ratings || [])
      setAverageRating(ratingsData?.average || null)
      setTotalReviews(ratingsData?.total_count || 0)

      setReviewSuccess(true)
      if (reviewSuccessTimerRef.current) {
        clearTimeout(reviewSuccessTimerRef.current)
      }
      reviewSuccessTimerRef.current = setTimeout(() => setReviewSuccess(false), 3000)
    } catch (err) {
      console.error('Error deleting rating:', err)
      setDeletingError(err.message || 'Error al eliminar la reseña')
    } finally {
      setDeletingRatingId(null)
    }
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

        {/* Notificaciones */}
        {reviewSuccess && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            ✅ ¡Reseña enviada con éxito!
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
                                className={`text-3xl transition-transform hover:scale-110 ${
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
                      {/* Cabecera */}
                      <div className="flex items-start justify-between mb-4">
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

                          {/* Info del estudiante */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-base">
                              {rating.student_name || 'Estudiante anónimo'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              📅 {rating.created_at
                                ? new Date(rating.created_at).toLocaleDateString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Recientemente'}
                            </p>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xl transition-transform ${
                                i < (rating.rating || 0)
                                  ? 'text-yellow-400 drop-shadow-sm'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Rating numérico */}
                      <div className="mb-4 inline-block bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                        <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                          {rating.rating}/5
                        </span>
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

                      {/* Botones de acción - Solo si es el autor */}
                      {user?.id === rating.student_id && (
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleEditRating(rating)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRating(rating.id)}
                            disabled={deletingRatingId === rating.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingRatingId === rating.id ? '⏳ Eliminando...' : '🗑️ Eliminar'}
                          </button>
                        </div>
                      )}

                      {deletingError && (
                        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm border border-red-200 dark:border-red-800">
                          ⚠️ {deletingError}
                        </div>
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
