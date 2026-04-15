const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const postsService = {
  // Obtener feed de todos los posts
  async getFeed(page = 1) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts?page=${page}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch feed')
      }

      const data = await response.json()
      console.log('✅ Feed fetched:', data)
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching feed:', error)
      throw error
    }
  },

  // Crear un nuevo post
  async createPost(content, file = null) {
    try {
      const formData = new FormData()
      formData.append('content', content)
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch(
        `${API_BASE_URL}/posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const data = await response.json()
      console.log('✅ Post created:', data)
      return data

    } catch (error) {
      console.error('❌ Error creating post:', error)
      throw error
    }
  },

  // Like a un post
  async likePost(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to like post')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('❌ Error liking post:', error)
      throw error
    }
  },

  // Unlike a un post
  async unlikePost(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/unlike`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to unlike post')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('❌ Error unliking post:', error)
      throw error
    }
  },

  // Comentar un post
  async commentPost(postId, comment) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ comment }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to comment post')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('❌ Error commenting post:', error)
      throw error
    }
  },

  // Obtener comentarios de un post
  async getComments(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/comments`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()
      return data.data || data

    } catch (error) {
      console.error('❌ Error fetching comments:', error)
      throw error
    }
  },

  // Actualizar un post
  async updatePost(postId, content, file = null) {
    try {
      const formData = new FormData()
      formData.append('content', content)
      if (file) {
        formData.append('file', file)
      }
      formData.append('_method', 'PUT') // Para soporte de PUT en formularios

      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('❌ Error updating post:', error)
      throw error
    }
  },

  // Eliminar un post
  async deletePost(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server response:', response.status, errorData)
        throw new Error(errorData.message || `Failed to delete post: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Post deleted:', data)
      return data

    } catch (error) {
      console.error('❌ Error deleting post:', error)
      throw error
    }
  },
}

export default postsService
