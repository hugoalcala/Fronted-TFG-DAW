import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { teachersService } from '../services/teachersService'
import { ratingsService } from '../services/ratingsService'
import { messagesService } from '../services/messagesService'

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

  const normalizeTeacher = (teacher) => {
    const userNode = teacher?.user || teacher
    return {
      id: teacher?.id ?? userNode?.id,
      name: teacher?.name ?? userNode?.name ?? '',
      subject: teacher?.subject ?? teacher?.specialty ?? userNode?.subject ?? '',
      rating: teacher?.rating ?? userNode?.rating ?? null,
      students_count: teacher?.students_count ?? teacher?.students ?? userNode?.students_count ?? 0,
      avatar_url: teacher?.avatar_url ?? userNode?.avatar_url ?? null,
      bio: teacher?.bio ?? userNode?.bio ?? '',
      price_per_hour: teacher?.price_per_hour ?? userNode?.price_per_hour ?? null,
      experience_years: teacher?.experience_years ?? userNode?.experience_years ?? null,
      education: teacher?.education ?? userNode?.education ?? '',
      email: teacher?.email ?? userNode?.email ?? '',
    }
  }

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
    
    if (!reviewText.trim()) {
      setReviewError('La reseña no puede estar vacía')
      return
    }

    setSubmittingReview(true)
    setReviewError(null)

    try {
      await ratingsService.createRating(teacherId, {
        rating: studentRating,
        review: reviewText.trim(),
      })

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
      setSubmittingReview(false)
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
              <div className="mb-6">
                <label 
                  id="rating-label"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-3"
                >
                  Calificación
                </label>
                <div 
                  className="flex gap-2"
                  role="radiogroup"
                  aria-labelledby="rating-label"
                >
                  {renderStars(studentRating)}
                </div>
              </div>

              {/* Texto de la reseña */}
              <div className="mb-6">
                <label 
                  htmlFor="review-text"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-3"
                >
                  Tu reseña
                </label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Comparte tu experiencia con este profesor..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  rows="5"
                />
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Reseñas ({totalReviews})
          </h3>

          {ratings.length > 0 ? (
            <div className="space-y-6">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="pb-6 border-b border-gray-200 dark:border-gray-800 last:border-b-0"
                >
                  {/* Cabecera de la reseña */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {rating.student_name || 'Estudiante anónimo'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {rating.created_at
                          ? new Date(rating.created_at).toLocaleDateString('es-ES')
                          : 'Recientemente'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < (rating.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Texto de la reseña */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {rating.review || 'Sin comentarios'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aún no hay reseñas. ¡Sé el primero en dejar una!
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
