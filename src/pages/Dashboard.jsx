import { useEffect, useState } from 'react'
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
  const [newPostLoading, setNewPostLoading] = useState(false)

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
        const data = await postsService.getFeed()
        
        if (Array.isArray(data)) {
          setPosts(data)
        } else if (data && data.data) {
          setPosts(data.data)
        } else {
          // Usar mock data si el backend no responde
          setPosts([
            {
              id: 1,
              author: 'Dr. Juan García',
              avatar: '👨‍🏫',
              subject: 'Matemáticas',
              title: '10 trucos para dominar el cálculo',
              content: 'Hoy comparto los mejores métodos que he aprendido en 15 años enseñando cálculo. Estos trucos te ayudarán a entender los conceptos de forma más rápida...',
              timestamp: 'hace 2 horas',
              likes: 24,
              comments: 5,
              image: '📐'
            },
            {
              id: 2,
              author: 'Ing. María López',
              avatar: '👩‍💼',
              subject: 'Programación',
              title: 'Introducción a React Hooks',
              content: 'Los hooks de React revolucionaron la forma en que escribimos componentes. En este post te explico cómo funcionan y cuándo usarlos...',
              timestamp: 'hace 4 horas',
              likes: 45,
              comments: 12,
              image: '⚛️'
            },
          ])
        }
      } catch (error) {
        console.error('Error loading posts:', error)
        // Mantener posts vacío o usar mock data
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [isAuthenticated])

  // Crear nuevo post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Por favor escribe algo en el post')
      return
    }

    try {
      setNewPostLoading(true)
      const result = await postsService.createPost(newPostContent)
      
      if (result) {
        setNewPostContent('')
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

  // Like a un post
  const handleLikePost = async (postId) => {
    try {
      await postsService.likePost(postId)
      // Actualizar el estado local
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      ))
    } catch (error) {
      console.error('Error liking post:', error)
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
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl">
                👤
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="¿En qué estás pensando? Comparte una pregunta o consejo..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  rows="3"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={() => setNewPostContent('')}
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
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{post.avatar}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {post.author}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {post.subject} • {post.timestamp}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      ⋯
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {post.content}
                    </p>
                    {post.image && (
                      <div className="text-6xl text-center py-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {post.image}
                      </div>
                    )}
                  </div>

                  {/* Post Footer */}
                  <div className="flex items-center justify-around pt-4 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      👍 {post.likes}
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      💬 {post.comments}
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
    </AuthLayout>
  )
}

export default Dashboard
