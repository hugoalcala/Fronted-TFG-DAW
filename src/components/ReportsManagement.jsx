import { useState, useEffect } from 'react'
import { reportService } from '../services/reportService'

export default function ReportsManagement() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    reason: '',
    page: 1,
    perPage: 10,
  })
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const statusOptions = ['pending', 'approved', 'rejected']
  const reasonOptions = [
    'inappropriate_content',
    'harassment',
    'spam',
    'misinformation',
    'other',
  ]

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    loadReports()
  }, [filters])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await reportService.getAllReports(filters)
      setReports(data.reports || data.data || [])
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1)
      }
    } catch (err) {
      console.error('Error loading reports:', err)
      showNotification('Error al cargar denuncias', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReport = async (reportId) => {
    try {
      setActionLoading(true)
      await reportService.approveReport(reportId, adminNotes)
      showNotification('✅ Denuncia aprobada correctamente', 'success')
      setShowDetailModal(false)
      setAdminNotes('')
      setSelectedReport(null)
      loadReports()
    } catch (err) {
      showNotification(err.message || 'Error al aprobar denuncia', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectReport = async (reportId) => {
    try {
      setActionLoading(true)
      await reportService.rejectReport(reportId, adminNotes)
      showNotification('✅ Denuncia rechazada correctamente', 'success')
      setShowDetailModal(false)
      setAdminNotes('')
      setSelectedReport(null)
      loadReports()
    } catch (err) {
      showNotification(err.message || 'Error al rechazar denuncia', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openReportDetail = async (report) => {
    try {
      const details = await reportService.getReportDetails(report.id)
      setSelectedReport(details)
      setShowDetailModal(true)
    } catch (err) {
      showNotification('Error loading report details', 'error')
    }
  }

  const getStatusBadgeColor = (status) => {
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

  const getReasonLabel = (reason) => {
    const labels = {
      inappropriate_content: 'Contenido Inapropiado',
      harassment: 'Acoso',
      spam: 'Spam',
      misinformation: 'Desinformación',
      other: 'Otro',
    }
    return labels[reason] || reason
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      reason: '',
      page: 1,
      perPage: 10,
    })
  }

  return (
    <div className="w-full">
      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'pending' ? 'Pendiente' : status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Razón
            </label>
            <select
              value={filters.reason}
              onChange={(e) =>
                setFilters({ ...filters, reason: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas las razones</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {getReasonLabel(reason)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(filters.status || filters.reason) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Filtros activos:</span>
            {filters.status && <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 rounded">{filters.status === 'pending' ? '⏳' : filters.status === 'approved' ? '✅' : '❌'} {filters.status === 'pending' ? 'Pendiente' : filters.status === 'approved' ? 'Aprobado' : 'Rechazado'}</span>}
            {filters.reason && <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded">📋 {getReasonLabel(filters.reason)}</span>}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando denuncias...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚩</div>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.status || filters.reason ? 'No se encontraron denuncias con esos filtros' : 'No hay denuncias registradas'}
          </p>
          <button
            onClick={loadReports}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🔄 Recargar
          </button>
        </div>
      ) : (
        <>
          {/* Tabla de denuncias */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Razón
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                      #{report.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {report.reported_user?.name || 'Desconocido'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {getReasonLabel(report.reason)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.status === 'pending' ? 
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        report.status === 'approved' ?
                          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {report.status === 'pending' ? '⏳ Pendiente' : report.status === 'approved' ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => openReportDetail(report)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Página {filters.page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
                  disabled={filters.page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Detalles de la Denuncia
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">ID</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">#{selectedReport.id}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Estado</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    selectedReport.status === 'pending' ? 
                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    selectedReport.status === 'approved' ?
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {selectedReport.status === 'pending' ? '⏳ Pendiente' : selectedReport.status === 'approved' ? '✅ Aprobado' : '❌ Rechazado'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Usuario Denunciado</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedReport.reported_user?.name || 'Desconocido'} ({selectedReport.reported_user?.email || 'Sin email'})
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Razón</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{getReasonLabel(selectedReport.reason)}</p>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Descripción</label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {selectedReport.description || 'Sin descripción'}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Fecha</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(selectedReport.created_at).toLocaleDateString()} - {new Date(selectedReport.created_at).toLocaleTimeString()}
                </p>
              </div>

              {selectedReport.status === 'pending' && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                    Notas del Administrador
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Agregar notas (opcional)"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setAdminNotes('')
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cerrar
              </button>

              {selectedReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRejectReport(selectedReport.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? '⏳ Procesando...' : '❌ Rechazar'}
                  </button>
                  <button
                    onClick={() => handleApproveReport(selectedReport.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? '⏳ Procesando...' : '✅ Aprobar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
