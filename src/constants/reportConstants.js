/**
 * Constantes compartidas para denuncias
 * Valores deben coincidir exactamente con el backend
 */

export const REPORT_REASONS = {
  offensive_content: 'offensive_content',
  spam: 'spam',
  fake_review: 'fake_review',
  inappropriate: 'inappropriate',
  other: 'other',
}

export const REPORT_REASON_OPTIONS = [
  { value: 'offensive_content', label: 'Contenido Ofensivo' },
  { value: 'spam', label: 'Spam' },
  { value: 'fake_review', label: 'Reseña Falsa' },
  { value: 'inappropriate', label: 'Inapropiado' },
  { value: 'other', label: 'Otro' },
]

export const REPORT_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
}

export const REPORT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', emoji: '⏳' },
  { value: 'approved', label: 'Aprobado', emoji: '✅' },
  { value: 'rejected', label: 'Rechazado', emoji: '❌' },
]

/**
 * Obtener etiqueta legible para una razón
 */
export const getReasonLabel = (reason) => {
  const option = REPORT_REASON_OPTIONS.find(opt => opt.value === reason)
  return option ? option.label : reason
}

/**
 * Obtener etiqueta legible para un estado
 */
export const getStatusLabel = (status) => {
  const option = REPORT_STATUS_OPTIONS.find(opt => opt.value === status)
  return option ? option.label : status
}

/**
 * Obtener emoji para un estado
 */
export const getStatusEmoji = (status) => {
  const option = REPORT_STATUS_OPTIONS.find(opt => opt.value === status)
  return option ? option.emoji : ''
}

/**
 * Obtener clases de color para un estado
 */
export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    case 'approved':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }
}
