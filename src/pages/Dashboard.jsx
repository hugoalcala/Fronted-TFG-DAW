import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import { postsService } from '../services/postsService'
import { profileService } from '../services/profileService'

function Dashboard() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [hashtagSearch, setHashtagSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostFile, setNewPostFile] = useState(null)
  const [newPostFilePreview, setNewPostFilePreview] = useState(null)
  const [newPostFileType, setNewPostFileType] = useState(null)
  const [newPostFileName, setNewPostFileName] = useState(null)
  const [newPostLoading, setNewPostLoading] = useState(false)
  
  // Estados para editar posts
  const [editingPostId, setEditingPostId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editFile, setEditFile] = useState(null)
  const [editFilePreview, setEditFilePreview] = useState(null)
  const [editFileType, setEditFileType] = useState(null)
  const [editFileName, setEditFileName] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState(null)
  const [openMenuPostId, setOpenMenuPostId] = useState(null)
  const [userLikes, setUserLikes] = useState(new Set()) // Posts que el usuario ya le dio like
  const [liking, setLiking] = useState(null) // Post que se está procesando like
  const [sharePostId, setSharePostId] = useState(null) // Post que se está compartiendo
  const [commentingPostId, setCommentingPostId] = useState(null) // Post siendo comentado
  const [postComments, setPostComments] = useState({}) // Comentarios por post: { postId: [comments] }
  const [commentText, setCommentText] = useState('') // Texto del nuevo comentario
  const [loadingComments, setLoadingComments] = useState({}) // Cargando comentarios por post
  const [submittingComment, setSubmittingComment] = useState(false) // Enviando comentario
  const [editingCommentId, setEditingCommentId] = useState(null) // Comentario siendo editado
  const [editingCommentText, setEditingCommentText] = useState('') // Texto del comentario siendo editado
  const [deletingCommentId, setDeletingCommentId] = useState(null) // Comentario siendo eliminado
  const [replyingToCommentId, setReplyingToCommentId] = useState(null) // Respondiendo a qué comentario
  const [replyText, setReplyText] = useState('') // Texto de la respuesta
  const [submittingReply, setSubmittingReply] = useState(false) // Enviando respuesta
  const [reportingPostId, setReportingPostId] = useState(null) // Post que se está denunciando
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const menuTimerRef = useRef(null)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, loading, navigate])

  // Redirigir a admin si el usuario es administrador
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      console.log(' Admin detectado, redirigiendo a panel de administración')
      navigate('/admin')
    }
  }, [user, loading, isAuthenticated, navigate])

  // Cargar posts del feed
  useEffect(() => {
    const loadPosts = async () => {
      if (!isAuthenticated) return
      
      try {
        setPostsLoading(true)
        
        // Cargar posts
        const postsData = await postsService.getFeed()
        
        // Procesar posts
        let posts = []
        if (Array.isArray(postsData)) {
          posts = postsData
        } else if (postsData && postsData.data) {
          posts = postsData.data
        }
        
        console.log('✅ Posts cargados:', posts.length, posts)
        setPosts(posts)
        
        // Cargar likes DESPUÉS de que los posts estén listos
        const likedPostIds = await postsService.getUserLikedPosts()
        console.log('Raw liked IDs from server:', likedPostIds)
        
        // Convertir IDs a números
        const normalizedLikedIds = (likedPostIds || []).map(id => Number(id))
        console.log('ormalized liked IDs:', normalizedLikedIds)
        
        const likesSet = new Set(normalizedLikedIds)
        console.log('✅ Setting userLikes Set:', Array.from(likesSet))
        setUserLikes(likesSet)
        
      } catch (error) {
        console.error('❌ Error loading posts:', error)
        setPosts([])
        setUserLikes(new Set())
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [isAuthenticated, user?.id])

  // Monitor userLikes changes
  useEffect(() => {
    console.log('🔍 userLikes updated:', Array.from(userLikes))
  }, [userLikes])

  // Determinar tipo de archivo y obtener icono
  const getFileInfo = (file) => {
    const extension = file?.name?.split('.')?.pop()?.toLowerCase() || ''
    const name = file?.name || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return { type: 'image', icon: '🖼️', label: 'Imagen' }
    }
    if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(extension)) {
      return { type: 'video', icon: '🎥', label: 'Video' }
    }
    if (extension === 'pdf') {
      return { type: 'pdf', icon: '📄', label: 'PDF' }
    }
    if (['doc', 'docx'].includes(extension)) {
      return { type: 'document', icon: '📝', label: 'Documento' }
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return { type: 'document', icon: '📊', label: 'Hoja de cálculo' }
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return { type: 'document', icon: '🎞️', label: 'Presentación' }
    }
    if (['zip', 'rar'].includes(extension)) {
      return { type: 'archive', icon: '📦', label: 'Archivo comprimido' }
    }
    return { type: 'file', icon: '📎', label: 'Archivo' }
  }

  // Manejar selección de archivo para nuevo post
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewPostFile(file)
      const fileInfo = getFileInfo(file)
      setNewPostFileType(fileInfo.type)
      setNewPostFileName(file.name)
      
      // Crear preview
      if (fileInfo.type === 'image') {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewPostFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setNewPostFilePreview(fileInfo)
      }
    }
  }

  // Manejar eliminación de archivo preview
  const handleRemoveFile = () => {
    setNewPostFile(null)
    setNewPostFilePreview(null)
    setNewPostFileType(null)
    setNewPostFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Manejar selección de archivo para edición
  const handleEditFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditFile(file)
      const fileInfo = getFileInfo(file)
      setEditFileType(fileInfo.type)
      setEditFileName(file.name)
      
      // Crear preview
      if (fileInfo.type === 'image') {
        const reader = new FileReader()
        reader.onloadend = () => {
          setEditFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setEditFilePreview(fileInfo)
      }
    }
  }

  // Manejar eliminación de archivo en edición
  const handleRemoveEditFile = () => {
    setEditFile(null)
    setEditFilePreview(null)
    setEditFileType(null)
    setEditFileName(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  // Renderizar preview del archivo
  const renderFilePreview = (preview, fileType) => {
    if (!preview) return null
    
    if (fileType === 'image' && typeof preview === 'string') {
      return (
        <img src={preview} alt="Preview" className="max-h-40 rounded-lg" />
      )
    }
    
    if (typeof preview === 'object') {
      return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 inline-flex items-center gap-3">
          <span className="text-3xl">{preview.icon}</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{preview.label}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{preview.label}</p>
          </div>
        </div>
      )
    }
    
    return null
  }

  // Manejar selección de archivo para nuevo post
  const handleImageSelect = handleFileSelect
  const handleRemoveImage = handleRemoveFile
  const handleEditImageSelect = handleEditFileSelect
  const handleRemoveEditImage = handleRemoveEditFile

  // Crear nuevo post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Por favor escribe algo en el post')
      return
    }

    try {
      setNewPostLoading(true)
      const result = await postsService.createPost(newPostContent, newPostFile)
      
      if (result) {
        setNewPostContent('')
        setNewPostFile(null)
        setNewPostFilePreview(null)
        setNewPostFileType(null)
        setNewPostFileName(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        
        // Recargar posts
        const data = await postsService.getFeed()
        if (Array.isArray(data)) {
          setPosts(data)
        }
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('No se pudo publicar el post')
    } finally {
      setNewPostLoading(false)
    }
  }

  // Like o Unlike a un post (toggle)
  const handleLikePost = async (postId) => {
    try {
      const numPostId = Number(postId)
      setLiking(numPostId)
      const isLiked = userLikes.has(numPostId)
      
      console.log(`👍 Post ${numPostId}: ${isLiked ? 'quitando like' : 'dando like'}`)
      console.log('userLikes antes:', Array.from(userLikes))
      
      if (isLiked) {
        // Quitar like
        await postsService.unlikePost(numPostId)
        console.log(`✅ Like removido del post ${numPostId}`)
        
        // Actualizar estado
        const newLikes = new Set(userLikes)
        newLikes.delete(numPostId)
        setUserLikes(newLikes)
        console.log('userLikes después (unlike):', Array.from(newLikes))
        
        // Actualizar contador del post
        setPosts(prevPosts =>
          prevPosts.map(post => 
            post.id === numPostId 
              ? { ...post, likes_count: Math.max(0, (post.likes_count || 1) - 1) } 
              : post
          )
        )
      } else {
        // Dar like
        await postsService.likePost(numPostId)
        console.log(`✅ Like agregado al post ${numPostId}`)
        
        // Actualizar estado
        const newLikes = new Set(userLikes)
        newLikes.add(numPostId)
        setUserLikes(newLikes)
        console.log('userLikes después (like):', Array.from(newLikes))
        
        // Actualizar contador del post
        setPosts(prevPosts =>
          prevPosts.map(post => 
            post.id === numPostId 
              ? { ...post, likes_count: (post.likes_count || 0) + 1 } 
              : post
          )
        )
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error)
      // Recargar likes desde el servidor en caso de error
      postsService.getUserLikedPosts().then(likedPostIds => {
        const normalizedIds = (likedPostIds || []).map(id => Number(id))
        console.log('Sincronizando likes desde servidor:', normalizedIds)
        setUserLikes(new Set(normalizedIds))
      })
    } finally {
      setLiking(null)
    }
  }




  // Abrir modal de edición
  const handleEditPost = (post) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setEditFile(null)
    
    // Si el post tiene archivo, mostrar preview
    if (post.file_url) {
      const fileInfo = {
        type: post.file_type || 'file',
        icon: '📎',
        label: post.file_name || 'Archivo'
      }
      
      if (post.file_type === 'image') {
        setEditFilePreview(post.file_url)
      } else {
        setEditFilePreview(fileInfo)
      }
      
      setEditFileType(post.file_type)
      setEditFileName(post.file_name)
    } else {
      setEditFilePreview(null)
      setEditFileType(null)
      setEditFileName(null)
    }
    
    setOpenMenuPostId(null)
  }

  // Guardar cambios del post editado
  const handleSaveEditPost = async () => {
    if (!editContent.trim()) {
      alert('Por favor escribe algo en el post')
      return
    }

    try {
      setEditLoading(true)
      await postsService.updatePost(editingPostId, editContent, editFile)
      
      // Construir objeto actualizado con cambios completos
      const updatedPostData = {
        content: editContent
      }
      
      // Manejar cambios de archivo
      if (editFile) {
        // Nuevo archivo
        updatedPostData.file_type = editFileType
        updatedPostData.file_name = editFileName
        updatedPostData.file_url = editFilePreview || null
      } else {
        // Sin archivo - se eliminó
        updatedPostData.file_url = null
        updatedPostData.file_type = null
        updatedPostData.file_name = null
      }
      
      setPosts(posts.map(post =>
        post.id === editingPostId ? { 
          ...post,
          ...updatedPostData
        } : post
      ))
      
      setEditingPostId(null)
      setEditContent('')
      setEditFile(null)
      setEditFilePreview(null)
      setEditFileType(null)
      setEditFileName(null)
      if (editFileInputRef.current) editFileInputRef.current.value = ''
    } catch (error) {
      console.error('Error updating post:', error)
      alert('No se pudo actualizar el post')
    } finally {
      setEditLoading(false)
    }
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditContent('')
    setEditFile(null)
    setEditFilePreview(null)
    setEditFileType(null)
    setEditFileName(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  // Eliminar post con confirmación
  const handleDeletePost = async (postId) => {
    console.log('🗑️ CLIC EN ELIMINAR - Post ID:', postId)
    
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      console.log('❌ Usuario canceló')
      return
    }

    try {
      console.log('📤 Enviando DELETE request...')
      setDeletingPostId(postId)
      const result = await postsService.deletePost(postId)
      console.log('✅ Post eliminado:', result)
      
      // Remover post de la lista
      setPosts(posts.filter(post => post.id !== postId))
      setOpenMenuPostId(null)
      alert('✅ Post eliminado exitosamente')
    } catch (error) {
      console.error('❌ ERROR:', error.message)
      alert(`Error: ${error.message}`)
    } finally {
      setDeletingPostId(null)
    }
  }

  // Compartir post
  const handleSharePost = (post) => {
    const postUrl = `${window.location.origin}/dashboard?post=${post.id}`
    const shareText = `${post.content.substring(0, 100)}... ${post.author || 'Un usuario'} en eduConnect 🎓`
    
    // Opciones de compartir
    const shareOptions = [
      {
        name: 'Twitter / X',
        icon: '𝕏',
        handler: () => {
          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
          window.open(url, '_blank', 'width=600,height=400')
        }
      },
      {
        name: 'Facebook',
        icon: '�',
        handler: () => {
          const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
          window.open(url, '_blank', 'width=600,height=400')
        }
      },
      {
        name: 'WhatsApp',
        icon: '💬',
        handler: () => {
          const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`
          window.open(url, '_blank')
        }
      },
      {
        name: 'LinkedIn',
        icon: '🔗',
        handler: () => {
          const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`
          window.open(url, '_blank', 'width=600,height=400')
        }
      },
      {
        name: 'Copiar enlace',
        icon: '📋',
        handler: () => {
          navigator.clipboard.writeText(postUrl)
          alert('✅ Enlace copiado al portapapeles')
          setSharePostId(null)
        }
      },
    ]
    
    return shareOptions
  }

  // Cargar comentarios de un post
  const handleLoadComments = async (postId) => {
    if (postComments[postId]) {
      // Ya estaban cargados, solo abrir modal
      setCommentingPostId(postId)
      setCommentText('')
      return
    }

    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }))
      const comments = await postsService.getComments(postId)
      setPostComments(prev => ({ ...prev, [postId]: comments || [] }))
      setCommentingPostId(postId)
      setCommentText('')
    } catch (error) {
      console.error('Error loading comments:', error)
      alert('No se pudieron cargar los comentarios')
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Crear nuevo comentario
  const handleAddComment = async (postId) => {
    if (!commentText.trim()) {
      alert('Por favor escribe un comentario')
      return
    }

    try {
      setSubmittingComment(true)
      const result = await postsService.commentPost(postId, commentText)
      
      if (result) {
        // Agregar el comentario a la lista local
        const newComment = result.data || result
        setPostComments(prev => ({
          ...prev,
          [postId]: Array.isArray(prev[postId]) ? [...prev[postId], newComment] : [newComment]
        }))
        
        // Limpiar campo de texto
        setCommentText('')
        
        // Actualizar contador de comentarios en el post
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, comments_count: (post.comments_count || 0) + 1 }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('No se pudo publicar el comentario')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Editar comentario
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.comment)
  }

  // Guardar comentario editado
  const handleSaveEditComment = async (postId, commentId) => {
    if (!editingCommentText.trim()) {
      alert('Por favor escribe algo')
      return
    }

    try {
      setSubmittingComment(true)
      const result = await postsService.updateComment(postId, commentId, editingCommentText)
      
      if (result) {
        // Función recursiva para actualizar comentario en cualquier nivel
        const updateCommentRecursively = (comments) => {
          return comments.map(c => {
            if (c.id === commentId) {
              return { ...c, comment: editingCommentText }
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateCommentRecursively(c.replies) }
            }
            return c
          })
        }
        
        setPostComments(prev => ({
          ...prev,
          [postId]: updateCommentRecursively(prev[postId])
        }))
        
        setEditingCommentId(null)
        setEditingCommentText('')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('No se pudo editar el comentario')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Cancelar edición de comentario
  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  // Eliminar comentario
  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return
    }

    try {
      setDeletingCommentId(commentId)
      await postsService.deleteComment(postId, commentId)
      
      // Si no hay error, proceder a eliminar - función recursiva para eliminar comentario en cualquier nivel
      const deleteCommentRecursively = (comments) => {
        return comments
          .filter(c => c.id !== commentId)
          .map(c => {
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: deleteCommentRecursively(c.replies) }
            }
            return c
          })
      }
      
      setPostComments(prev => ({
        ...prev,
        [postId]: deleteCommentRecursively(prev[postId])
      }))
      
      // Actualizar contador de comentarios en el post
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments_count: Math.max(0, (post.comments_count || 1) - 1) }
            : post
        )
      )
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('No se pudo eliminar el comentario')
    } finally {
      setDeletingCommentId(null)
    }
  }

  // Responder a un comentario
  const handleReplyComment = async (postId, parentCommentId) => {
    if (!replyText.trim()) {
      alert('Por favor escribe una respuesta')
      return
    }

    try {
      setSubmittingReply(true)
      const result = await postsService.commentPost(postId, replyText, parentCommentId)
      
      if (result) {
        // Agregar la respuesta al comentario padre - búsqueda recursiva
        const newReply = result.data || result
        
        const insertReplyIntoTree = (comments) => {
          return comments.map(c => {
            if (c.id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply]
              }
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: insertReplyIntoTree(c.replies)
              }
            }
            return c
          })
        }
        
        setPostComments(prev => ({
          ...prev,
          [postId]: insertReplyIntoTree(prev[postId])
        }))
        
        setReplyingToCommentId(null)
        setReplyText('')
      }
    } catch (error) {
      console.error('Error replying to comment:', error)
      alert('No se pudo publicar la respuesta')
    } finally {
      setSubmittingReply(false)
    }
  }

  // Renderizar un comentario con sus respuestas (recursivo)
  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} className={`flex gap-3 pb-3 ${depth > 0 ? 'ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className={`${depth > 0 ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800`}>
        {comment.avatar_url ? (
          <img src={comment.avatar_url} alt={comment.author} className="w-full h-full object-cover" />
        ) : (
          <span>{comment.avatar || '👤'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-gray-900 dark:text-white ${depth > 0 ? 'text-xs' : 'text-sm'}`}>
              {comment.author || comment.user?.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {comment.timestamp || 'Recientemente'}
            </p>
          </div>
          
          {/* Botones de editar/eliminar - solo para el propietario */}
          {(Number(user?.id) === Number(comment.user_id) || Number(user?.id) === Number(comment.user?.id)) && (
            <div className="flex gap-2">
              <button
                onClick={() => handleEditComment(comment)}
                className="text-xs px-1.5 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteComment(commentingPostId, comment.id)}
                disabled={deletingCommentId === comment.id}
                className="text-xs px-1.5 py-0.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 cursor-pointer"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        
        {/* Mostrar comentario o campo de edición */}
        {editingCommentId === comment.id ? (
          <div className="mt-2">
            <textarea
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-sm"
              rows="2"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSaveEditComment(commentingPostId, comment.id)}
                disabled={submittingComment || !editingCommentText.trim()}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelEditComment}
                className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-gray-700 dark:text-gray-300 break-words ${depth > 0 ? 'text-xs' : 'text-sm'}`}>
              {comment.comment}
            </p>
            
            {/* Botón de responder */}
            {depth < 2 && (
              <button
                onClick={() => setReplyingToCommentId(comment.id)}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Responder
              </button>
            )}
          </>
        )}
        
        {/* Campo de respuesta */}
        {replyingToCommentId === comment.id && (
          <div className="mt-2 mb-3 flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 flex gap-1">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-xs"
                rows="1"
              />
              <button
                onClick={() => handleReplyComment(commentingPostId, comment.id)}
                disabled={submittingReply || !replyText.trim()}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setReplyingToCommentId(null)
                  setReplyText('')
                }}
                className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Renderizar respuestas recursivamente */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    </div>
  )

  const handleReportPost = async () => {
    if (!reportReason) return
    try {
      setSubmittingReport(true)
      await postsService.reportPost(reportingPostId, reportReason, reportDetails)
      setReportingPostId(null)
      setReportReason('')
      setReportDetails('')
      alert('Denuncia enviada correctamente')
    } catch (error) {
      alert(error.message || 'Error al enviar la denuncia')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Bienvenido, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Aquí encontrarás contenido personalizado basado en tus intereses
            </p>
          </div>

          {/* Create Post */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="¿En qué estás pensando? Comparte una pregunta o consejo..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  rows="3"
                />
                
                {/* File Preview */}
                {newPostFilePreview && (
                  <div className="mt-3 relative inline-block">
                    {renderFilePreview(newPostFilePreview, newPostFileType)}
                    <button
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {/* File Input */}
                <div className="flex items-center gap-2 mt-3 mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="post-file-input"
                  />
                  <label
                    htmlFor="post-file-input"
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer text-sm font-medium"
                  >
                     Agregar archivo
                  </label>
                </div>
                
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={() => {
                      setNewPostContent('')
                      handleRemoveFile()
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreatePost}
                    disabled={newPostLoading || !newPostContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {newPostLoading ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {postsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Cargando posts...</p>
              </div>
            ) : (() => {
              const filteredPosts = posts.filter(p => {
                const content = p.content?.toLowerCase() || ''
                const matchesHashtag = hashtagSearch ? content.includes(hashtagSearch.toLowerCase()) : true
                const matchesKeyword = keywordSearch ? content.includes(keywordSearch.toLowerCase()) : true
                return matchesHashtag && matchesKeyword
              })
              return filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-shadow relative"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt={post.author} className="w-full h-full object-cover" />
                        ) : (
                          <span>{post.avatar || '👤'}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {post.author || post.user?.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {post.subject || post.category || 'General'} • {post.timestamp || 'Recientemente'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Menú de opciones */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        ⋯
                      </button>

                      {openMenuPostId === post.id && (
                        <div
                          className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-max"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {Number(user?.id) === Number(post.user_id) ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditPost(post) }}
                                className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }}
                                className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm border-t border-gray-200 dark:border-gray-700"
                              >
                                🗑️ Eliminar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReportingPostId(post.id); setOpenMenuPostId(null) }}
                              className="w-full text-left px-4 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm"
                            >
                              🚩 Denunciar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {post.content}
                    </p>
                    {post.file_url && (
                      <div className="mt-3">
                        {post.file_type === 'image' ? (
                          <img 
                            src={post.file_url} 
                            alt="Post" 
                            className="w-full max-h-80 object-cover rounded-lg mb-4"
                          />
                        ) : post.file_type === 'video' ? (
                          <video 
                            src={post.file_url} 
                            controls
                            className="w-full max-h-80 rounded-lg mb-4"
                          />
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4 mb-4 w-full overflow-hidden">
                            <span className="text-4xl flex-shrink-0">
                              {post.file_type === 'pdf' ? '📄' :
                               post.file_type === 'document' ? '📝' :
                               post.file_type === 'archive' ? '📦' : '📎'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {post.file_name || 'Archivo'}
                              </p>
                              <a
                                href={post.file_url}
                                download={post.file_name || 'archivo'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Descargar
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Footer */}
                  <div className="flex items-center justify-around pt-4 border-t border-gray-200 dark:border-gray-800">
                    {(() => {
                      const postIdNum = Number(post.id)
                      const isLiked = userLikes.has(postIdNum)
                      console.log(`Post ${postIdNum}: liked=${isLiked}, allLikes=[${Array.from(userLikes)}]`)
                      return (
                        <button 
                          onClick={() => handleLikePost(postIdNum)}
                          disabled={liking === postIdNum}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all transform ${
                            isLiked
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-105 shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${liking === postIdNum ? 'opacity-50 cursor-not-allowed scale-100' : 'hover:scale-105'}`}
                        >
                          <span className={`text-lg ${isLiked ? 'animate-pulse' : ''}`}>
                            {isLiked ? '❤️' : '🤍'}
                          </span>
                          {post.likes_count || 0}
                        </button>
                      )
                    })()}
                    <button 
                      onClick={() => handleLoadComments(post.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-semibold"
                    >
                      💬 {post.comments_count || 0}
                    </button>
                    <button 
                      onClick={() => setSharePostId(post.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 transition-colors font-semibold"
                    >
                      📤 
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-400">
                  {hashtagSearch || keywordSearch
                    ? `No hay posts con ${[keywordSearch, hashtagSearch].filter(Boolean).join(' + ')}`
                    : 'No hay posts todavía. ¡Sé el primero en compartir algo!'}
                </p>
                {(hashtagSearch || keywordSearch) && (
                  <button
                    onClick={() => { setHashtagSearch(''); setKeywordSearch('') }}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver todos los posts
                  </button>
                )}
              </div>
            )
            })()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Keyword Search Widget */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Buscar posts
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Buscar por palabra..."
                className="w-full pl-8 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {keywordSearch && (
                <button
                  onClick={() => setKeywordSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Trending Widget */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Trending
            </h3>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold select-none text-sm">#</span>
              <input
                type="text"
                value={hashtagSearch.startsWith('#') ? hashtagSearch.slice(1) : hashtagSearch}
                onChange={(e) => setHashtagSearch(e.target.value ? `#${e.target.value.replace(/^#/, '')}` : '')}
                placeholder="Buscar por hashtag..."
                className="w-full pl-6 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {hashtagSearch && (
                <button
                  onClick={() => setHashtagSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm leading-none"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="space-y-3">
              {[
                '#ReactHooks',
                '#EstructuraDatos',
                '#GramáticaInglés',
                '#MétodosDeEstudio',
              ].map((trend) => (
                <button
                  key={trend}
                  onClick={() => setHashtagSearch(hashtagSearch === trend ? '' : trend)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    hashtagSearch === trend
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
                  }`}
                >
                  {trend}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 p-6 max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Editar Post
            </h3>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edita tu post..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              rows="6"
            />
            
            {/* File Preview */}
            {editFilePreview && (
              <div className="mt-4 relative inline-block">
                {renderFilePreview(editFilePreview, editFileType)}
                <button
                  onClick={handleRemoveEditFile}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* File Input */}
            <div className="flex items-center gap-2 mt-4">
              <input
                ref={editFileInputRef}
                type="file"
                onChange={handleEditFileSelect}
                className="hidden"
                id="edit-post-file-input"
              />
              <label
                htmlFor="edit-post-file-input"
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer text-sm font-medium"
              >
                📎 {editFilePreview ? 'Cambiar archivo' : 'Agregar archivo'}
              </label>
            </div>
            
            <div className="flex gap-3 justify-end mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  handleCancelEdit()
                  handleRemoveEditFile()
                }}
                disabled={editLoading}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditPost}
                disabled={editLoading || !editContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú */}
      {openMenuPostId !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenuPostId(null)}
        />
      )}

      {/* Modal de Compartir */}
      {sharePostId && (() => {
        const postToShare = posts.find(p => p.id === sharePostId)
        const shareOptions = postToShare ? handleSharePost(postToShare) : []
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📤 Compartir post
                </h3>
                <button
                  onClick={() => setSharePostId(null)}
                  className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Post Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {postToShare?.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Por {postToShare?.author || 'Un usuario'}
                </p>
              </div>

              {/* Share Options Grid */}
              <div className="space-y-2">
                {shareOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.handler}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left font-medium text-gray-900 dark:text-white"
                  >
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSharePostId(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )
      })()}

      {/* Modal de Comentarios */}
      {commentingPostId && (() => {
        const postWithComments = posts.find(p => p.id === commentingPostId)
        const comments = postComments[commentingPostId] || []
        const isLoading = loadingComments[commentingPostId]

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 p-6 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  💬 Comentarios
                </h3>
                <button
                  onClick={() => {
                    setCommentingPostId(null)
                    setCommentText('')
                  }}
                  className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Post Original */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                    {postWithComments?.avatar_url ? (
                      <img src={postWithComments.avatar_url} alt={postWithComments.author} className="w-full h-full object-cover" />
                    ) : (
                      <span>{postWithComments?.avatar || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {postWithComments?.author || postWithComments?.user?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {postWithComments?.timestamp || 'Recientemente'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {postWithComments?.content}
                </p>
              </div>

              {/* Crear Comentario */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                {!commentText ? (
                  <div className="flex gap-2 items-end">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Añade un comentario..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden border-2 border-blue-200 dark:border-blue-800 mt-2">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="¿Qué piensas?"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none text-sm"
                        rows="2"
                      />
                      <div className="flex gap-2 flex-col">
                        <button
                          onClick={() => handleAddComment(commentingPostId)}
                          disabled={submittingComment || !commentText.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? '...' : '✓'}
                        </button>
                        <button
                          onClick={() => setCommentText('')}
                          className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Comentarios */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 dark:border-blue-400 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando comentarios...</p>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {comments.map((comment) => renderComment(comment))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400 py-8 text-sm">
                    No hay comentarios todavía. ¡Sé el primero!
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })()}
      {/* Modal de Denuncia */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🚩 Denunciar post</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="">Selecciona un motivo...</option>
                <option value="spam">Spam</option>
                <option value="offensive_content">Contenido ofensivo</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="fake">Información falsa</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles (opcional)</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe el problema..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setReportingPostId(null); setReportReason(''); setReportDetails('') }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleReportPost}
                disabled={!reportReason || submittingReport}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReport ? 'Enviando...' : 'Enviar denuncia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

export default Dashboard
