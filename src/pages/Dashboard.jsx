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
  const [categories] = useState(['Programación', 'Matemáticas', 'Inglés', 'Historia', 'Ciencias'])
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
      console.log('👑 Admin detectado, redirigiendo a panel de administración')
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
        console.log('📥 Raw liked IDs from server:', likedPostIds)
        
        // Convertir IDs a números
        const normalizedLikedIds = (likedPostIds || []).map(id => Number(id))
        console.log('✅ Normalized liked IDs:', normalizedLikedIds)
        
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
      
      // Actualizar post en la lista local
      const updatedPost = posts.find(p => p.id === editingPostId)
      if (editFile && editFilePreview && editFileType === 'image') {
        updatedPost.file_url = editFilePreview
      }
      
      setPosts(posts.map(post =>
        post.id === editingPostId ? { 
          ...post, 
          content: editContent,
          ...(editFile && editFileType === 'image' && editFilePreview && { file_url: editFilePreview })
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
                    📎 Agregar archivo
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
            ) : posts.length > 0 ? (
              posts.map((post) => (
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
                    
                    {/* Menú de opciones - solo para el autor */}
                    {Number(user?.id) === Number(post.user_id) && (
                      <div className="relative">
                        <button 
                          onClick={() => {
                            console.log(`Toggle menu para post ${post.id}, user: ${user?.id}, post_user: ${post.user_id}`)
                            setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          ⋯
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openMenuPostId === post.id && (
                          <div 
                            className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-max"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditPost(post)
                              }}
                              className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('📍 Click en eliminar para post:', post.id)
                                handleDeletePost(post.id)
                              }}
                              className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm border-t border-gray-200 dark:border-gray-700 hover:font-semibold"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 inline-flex items-center gap-4 mb-4">
                            <span className="text-4xl">
                              {post.file_type === 'pdf' ? '📄' : 
                               post.file_type === 'document' ? '📝' : 
                               post.file_type === 'archive' ? '📦' : '📎'}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white max-w-xs truncate">
                                {post.file_name || 'Archivo'}
                              </p>
                              <a 
                                href={post.file_url} 
                                download
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
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold">
                      💬 {post.comments_count || 0}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold">
                      📤 Compartir
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-400">
                  No hay posts todavía. ¡Sé el primero en compartir algo!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories Widget */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              📚 Categorías
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Widget */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🔥 Trending
            </h3>
            <div className="space-y-3">
              {[
                '#ReactHooks',
                '#EstructuraDatos',
                '#GramáticaInglés',
                '#MétodosDeEstudio',
              ].map((trend) => (
                <button
                  key={trend}
                  className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
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
    </AuthLayout>
  )
}

export default Dashboard
