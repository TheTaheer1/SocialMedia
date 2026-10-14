import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/useAuth'
import { useDispatch } from 'react-redux'
import { setPostsRedux } from '../redux/postSlice'
import { setStoriesRedux } from '../redux/storySlice'
import { setReelsRedux } from '../redux/reelSlice'
import { setCommentsRedux } from '../redux/commentSlice'
import { useSelector } from 'react-redux'
import MobileNav from '../components/MobileNav'

const initials = (value = '?') => value.slice(0, 2).toUpperCase()

function Avatar({ image, name, className = 'h-11 w-11' }) {
  const size = className.includes('h-full') ? 66 : className.includes('h-16') ? 64 : className.includes('h-9') ? 36 : className.includes('h-7') ? 28 : 44
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500 font-bold ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {image ? (
        <img src={image} alt={`${name || 'User'} profile`} className="block h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

function Home() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const unreadNotificationCount = useSelector((state) => state.notification.unreadCount)
  const storyInputRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [posts, setPosts] = useState([])
  const [reels, setReels] = useState([])
  const [stories, setStories] = useState([])
  const [activeStory, setActiveStory] = useState(null)
  const [storyDuration, setStoryDuration] = useState(30)
  const [viewedStories, setViewedStories] = useState(() => new Set())
  const [contentType, setContentType] = useState('post')
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [video, setVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [message, setMessage] = useState('')
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [liked, setLiked] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [commentActionLoading, setCommentActionLoading] = useState(false)

  // Edit post state
  const [editingPost, setEditingPost] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [editImage, setEditImage] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [openMenuPostId, setOpenMenuPostId] = useState(null)

  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  const name = user?.name || user?.username || 'You'
  const storyGroups = useMemo(() => Object.values(stories.reduce((groups, story) => {
    const key = story.author?._id || story.author?.username || 'unknown'
    if (!groups[key]) groups[key] = { key, items: [] }
    groups[key].items.push(story)
    return groups
  }, {})), [stories])
  const ownGroup = storyGroups.find((group) => {
    const author = group.items[0]?.author
    return author?.username === user?.username || String(author?._id || author) === String(user?._id)
  })
  const ownStory = ownGroup?.items[0]
  const activeGroup = activeStory
    ? storyGroups.find((group) => group.items.some((story) => story._id === activeStory._id))
    : null
  const activeStoryIndex = activeGroup ? activeGroup.items.findIndex((story) => story._id === activeStory._id) : -1

  const openStoryGroup = (group) => {
    if (!group?.items?.length) return
    setViewedStories((current) => new Set(current).add(group.items[0]._id))
    setStoryDuration(30)
    setActiveStory(group.items[0])
  }

  const moveStory = (direction) => {
    if (!activeGroup || activeStoryIndex < 0) return
    const nextIndex = activeStoryIndex + direction
    if (nextIndex >= 0 && nextIndex < activeGroup.items.length) {
      setViewedStories((current) => new Set(current).add(activeGroup.items[nextIndex]._id))
      setStoryDuration(30)
      setActiveStory(activeGroup.items[nextIndex])
      return
    }
    const groupIndex = storyGroups.findIndex((group) => group.key === activeGroup.key)
    const nextGroup = storyGroups[groupIndex + direction]
    if (nextGroup) {
      const nextStory = direction > 0 ? nextGroup.items[0] : nextGroup.items[nextGroup.items.length - 1]
      setViewedStories((current) => new Set(current).add(nextStory._id))
      setStoryDuration(30)
      setActiveStory(nextStory)
    }
    else setActiveStory(null)
  }

  const handleStoryVideoLoaded = (event) => {
    const duration = Math.min(event.currentTarget.duration || 30, 30)
    setStoryDuration(duration)
  }

  useEffect(() => {
    if (!activeStory) return undefined
    const timer = window.setTimeout(() => {
      moveStory(1)
    }, storyDuration * 1000)
    return () => window.clearTimeout(timer)
    // moveStory is intentionally recreated with the current story groups.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStory, activeGroup, activeStoryIndex, storyGroups, storyDuration])

  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => setMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [message])

  useEffect(() => {
    const query = searchTerm.trim()
    if (!query) return undefined

    let active = true
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await axiosInstance.get('/users/search', { params: { username: query } })
        if (active) setSearchResults(response.data.users || [])
      } catch {
        if (active) setSearchResults([])
      } finally {
        if (active) setSearchLoading(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImage(null)
      setImagePreview('')
    }
  }

  const cancelImageUpload = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImage(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    if (file) {
      setVideo(file)
      setVideoPreview(URL.createObjectURL(file))
    } else {
      setVideo(null)
      setVideoPreview('')
    }
  }

  const cancelVideoUpload = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideo(null)
    setVideoPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0] || null
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    if (file) {
      setEditImage(file)
      setEditImagePreview(URL.createObjectURL(file))
    } else {
      setEditImage(null)
      setEditImagePreview('')
    }
  }

  const cancelEditImage = () => {
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImage(null)
    setEditImagePreview('')
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const loadPosts = async () => {
    const r = await axiosInstance.get('/posts/getAllPosts').catch(() => axiosInstance.get('/posts'))
    setPosts(r.data.posts || [])
    dispatch(setPostsRedux(r.data.posts || []))
  }

  const loadReels = async () => {
    const r = await axiosInstance.get('/reels/getAllReels').catch(() => axiosInstance.get('/reels'))
    setReels(r.data.reels || [])
    dispatch(setReelsRedux(r.data.reels || []))
  }

  const loadStories = async () => {
    const response = await axiosInstance.get('/stories/getStories')
    setStories(response.data.stories || [])
    dispatch(setStoriesRedux(response.data.stories || []))
  }

  const handleStoryUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const form = new FormData()
    form.append('media', file)
    const caption = window.prompt('Add a story caption (optional):')
    if (caption) form.append('caption', caption)
    try {
      await axiosInstance.post('/stories/createStory', form)
      await loadStories()
      setMessage('Story published for 24 hours!')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to publish story.')
    }
  }

  const editStory = async () => {
    if (!activeStory || activeStory.author?.username !== user?.username) return
    const caption = window.prompt('Update your story caption:', activeStory.caption || '')
    if (caption === null) return
    try {
      const response = await axiosInstance.put(`/stories/${activeStory._id}`, { caption })
      setStories((current) => current.map((story) => story._id === activeStory._id ? response.data.story : story))
      dispatch(setStoriesRedux(stories.map((story) => story._id === activeStory._id ? response.data.story : story)))
      setActiveStory(response.data.story)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update story.')
    }
  }

  const removeStory = async () => {
    if (!activeStory || activeStory.author?.username !== user?.username || !window.confirm('Delete this story?')) return
    try {
      await axiosInstance.delete(`/stories/${activeStory._id}`)
      const remaining = stories.filter((story) => story._id !== activeStory._id)
      setStories(remaining)
      dispatch(setStoriesRedux(remaining))
      setActiveStory(null)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete story.')
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      axiosInstance.get('/posts/getAllPosts').catch(() => axiosInstance.get('/posts')),
      axiosInstance.get('/reels/getAllReels').catch(() => axiosInstance.get('/reels'))
    ])
      .then(([p, r]) => {
        if (active) {
          setPosts(p.data.posts || [])
          dispatch(setPostsRedux(p.data.posts || []))
          setReels(r.data.reels || [])
          dispatch(setReelsRedux(r.data.reels || []))
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [dispatch])

  useEffect(() => {
    let active = true
    axiosInstance.get('/stories/getStories').then((response) => {
      if (!active) return
      setStories(response.data.stories || [])
      dispatch(setStoriesRedux(response.data.stories || []))
    }).catch(() => undefined)
    return () => { active = false }
  }, [dispatch])

  const createPost = async () => {
    if (!caption.trim() || !image) {
      return setMessage('Please add both a caption and an image.')
    }
    setSubmitting(true)
    setMessage('')
    const f = new FormData()
    f.append('caption', caption)
    f.append('image', image)

    try {
      await axiosInstance.post('/posts/createPost', f).catch(() => axiosInstance.post('/posts', f))
      await loadPosts()
      setCaption('')
      cancelImageUpload()
      setMessage('Post published successfully!')
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to publish post.')
    } finally {
      setSubmitting(false)
    }
  }

  const createReel = async () => {
    if (!caption.trim() || !video) {
      return setMessage('Please add both a caption and a video.')
    }
    setSubmitting(true)
    setMessage('')
    const f = new FormData()
    f.append('caption', caption)
    f.append('video', video)

    try {
      await axiosInstance.post('/reels/createReel', f).catch(() => axiosInstance.post('/reels', f))
      await loadReels()
      setCaption('')
      cancelVideoUpload()
      setMessage('Reel published successfully!')
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to publish reel.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (post) => {
    setEditingPost(post)
    setEditCaption(post.caption || '')
    cancelEditImage()
    setOpenMenuPostId(null)
  }

  const handleCloseEdit = () => {
    setEditingPost(null)
    setEditCaption('')
    cancelEditImage()
  }

  const handleSaveEdit = async () => {
    if (!editingPost) return
    if (!editCaption.trim()) {
      setMessage('Caption cannot be empty.')
      return
    }
    setEditLoading(true)
    const formData = new FormData()
    formData.append('caption', editCaption)
    if (editImage) {
      formData.append('image', editImage)
    }

    try {
      const res = await axiosInstance.put(`/posts/update/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => axiosInstance.put(`/posts/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }))

      const updated = res.data.post
      setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
      handleCloseEdit()
      setMessage('Post updated successfully!')
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to update post.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await axiosInstance.delete(`/posts/${postId}`)
      setPosts((prev) => prev.filter((p) => p._id !== postId))
      setOpenMenuPostId(null)
      setMessage('Post deleted successfully.')
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to delete post.')
    }
  }

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return
    try {
      await axiosInstance.delete(`/reels/${reelId}`)
      setReels((prev) => prev.filter((r) => r._id !== reelId))
      setOpenMenuPostId(null)
      setMessage('Reel deleted successfully.')
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to delete reel.')
    }
  }

  const toggleLike = async (item, type) => {
    const key = `${type}-${item._id}`
    try {
      const endpoint = type === 'reel' ? `/reels/like/${item._id}` : `/posts/like/${item._id}`
      const r = await axiosInstance.post(endpoint)
      setLiked((v) => ({ ...v, [key]: r.data.liked }))
      if (type === 'post') await loadPosts()
      else if (type === 'reel') await loadReels()
    } catch (e) {
      setMessage(e.response?.data?.message || 'Unable to update like.')
    }
  }

  const loadComments = async (id, type) => {
    const r = await axiosInstance.get('/comments', { params: type === 'post' ? { postId: id } : { reelId: id } })
    setComments((v) => ({ ...v, [`${type}-${id}`]: r.data.comments || [] }))
    dispatch(setCommentsRedux({ key: `${type}-${id}`, comments: r.data.comments || [] }))
  }

  useEffect(() => {
    const items = [
      ...posts.map((item) => ({ id: item._id, type: 'post' })),
      ...reels.map((item) => ({ id: item._id, type: 'reel' }))
    ]
    if (!items.length) return
    Promise.all(
      items.map(async ({ id, type }) => {
        const response = await axiosInstance.get('/comments', {
          params: type === 'post' ? { postId: id } : { reelId: id }
        })
        return [`${type}-${id}`, response.data.comments || []]
      })
    )
      .then((entries) => setComments((current) => ({ ...current, ...Object.fromEntries(entries) })))
      .catch(() => undefined)
  }, [posts, reels])

  useEffect(() => {
    const targetId = window.location.hash.slice(1)
    if (!targetId) return
    const timer = window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    return () => window.clearTimeout(timer)
  }, [posts, reels])

  const submitComment = async (id, type) => {
    const key = `${type}-${id}`
    const text = commentText[key]?.trim()
    if (!text) return
    await axiosInstance.post('/comments', type === 'post' ? { postId: id, text } : { reelId: id, text })
    setCommentText((v) => ({ ...v, [key]: '' }))
    await loadComments(id, type)
  }

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditingCommentText(comment.text || '')
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const handleSaveEditComment = async (commentId, contentId, type) => {
    const text = editingCommentText.trim()
    if (!text) return
    setCommentActionLoading(true)
    try {
      await axiosInstance.put(`/comments/update/${commentId}`, { text }).catch(() =>
        axiosInstance.put(`/comments/${commentId}`, { text })
      )
      await loadComments(contentId, type)
      handleCancelEditComment()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to update comment.')
    } finally {
      setCommentActionLoading(false)
    }
  }

  const handleDeleteComment = async (commentId, contentId, type) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    const key = `${type}-${contentId}`
    setCommentActionLoading(true)

    // Optimistic UI update
    setComments((v) => ({
      ...v,
      [key]: (v[key] || []).filter((c) => c._id !== commentId)
    }))

    try {
      await axiosInstance.delete(`/comments/${commentId}`).catch(() =>
        axiosInstance.delete(`/comments/delete/${commentId}`)
      )
      await loadComments(contentId, type)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete comment.')
      await loadComments(contentId, type)
    } finally {
      setCommentActionLoading(false)
    }
  }

  const shareItem = async (item) => {
    const url = `${window.location.origin}/home#${item._id}`
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied to clipboard!')
    } catch {
      setMessage(url)
    }
  }

  const engagement = (item, type) => {
    const key = `${type}-${item._id}`
    const isLiked =
      liked[key] !== undefined
        ? liked[key]
        : Boolean(
            user &&
              item.likes?.some((likeId) => {
                const idStr =
                  typeof likeId === 'object' && likeId !== null
                    ? String(likeId._id || likeId)
                    : String(likeId)
                return idStr === String(user._id || user.id)
              })
          )

    const likesCount = item.likes?.length || 0
    const commentsCount = comments[key]?.length || 0

    return (
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleLike(item, type)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
              isLiked ? 'bg-pink-500/20 text-pink-300 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {isLiked ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-400">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            )}
            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenComments((v) => ({ ...v, [key]: !v[key] }))
              if (!comments[key]) loadComments(item._id, type)
            }}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
            </svg>
            <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>
          <button
            type="button"
            onClick={() => shareItem(item)}
            className="rounded-full px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ↗ Share
          </button>
        </div>
        {openComments[key] && (
          <div className="mt-4 rounded-2xl bg-slate-950/50 p-3">
            <div className="flex gap-2">
              <input
                value={commentText[key] || ''}
                onChange={(e) => setCommentText((v) => ({ ...v, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && submitComment(item._id, type)}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={() => submitComment(item._id, type)}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400"
              >
                Post
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {(comments[key] || []).map((c) => {
                const currentUid = String(user?._id || user?.id || '')
                const isCommentAuthor =
                  Boolean(user) &&
                  ((c.author?._id && String(c.author._id) === currentUid) ||
                    (c.author?.username && c.author.username === user.username) ||
                    (typeof c.author === 'string' && String(c.author) === currentUid))

                const isContentOwner =
                  Boolean(user) &&
                  ((item.author?._id && String(item.author._id) === currentUid) ||
                    (item.author?.username && item.author.username === user.username) ||
                    (typeof item.author === 'string' && String(item.author) === currentUid))

                const canDeleteComment = isCommentAuthor || isContentOwner
                const isEditingThisComment = editingCommentId === c._id

                return (
                  <div key={c._id} className="flex items-start gap-2.5 text-sm group">
                    <div
                      className="cursor-pointer shrink-0 pt-0.5"
                      onClick={() =>
                        c.author?.username && navigate(`/profile/${encodeURIComponent(c.author.username)}`)
                      }
                    >
                      <Avatar
                        image={c.author?.profileImage}
                        name={c.author?.name || c.author?.username}
                        className="h-7 w-7 text-[10px]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditingThisComment ? (
                        <div className="flex flex-col gap-2 rounded-xl bg-slate-900 p-2.5 border border-slate-700">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditComment(c._id, item._id, type)
                              if (e.key === 'Escape') handleCancelEditComment()
                            }}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-400"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={handleCancelEditComment}
                              className="rounded-md px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={commentActionLoading || !editingCommentText.trim()}
                              onClick={() => handleSaveEditComment(c._id, item._id, type)}
                              className="rounded-md bg-indigo-500 px-3 py-1 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 leading-relaxed">
                            <b
                              className="mr-1.5 cursor-pointer text-white hover:underline"
                              onClick={() =>
                                c.author?.username &&
                                navigate(`/profile/${encodeURIComponent(c.author.username)}`)
                              }
                            >
                              {c.author?.name || c.author?.username}
                            </b>
                            <span className="text-slate-300">{c.text}</span>
                          </p>

                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 shrink-0">
                            {isCommentAuthor && (
                              <button
                                type="button"
                                onClick={() => handleStartEditComment(c)}
                                className="rounded p-1 text-xs text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition"
                                title="Edit comment"
                              >
                                ✎
                              </button>
                            )}
                            {canDeleteComment && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c._id, item._id, type)}
                                className="rounded p-1 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
                                title="Delete comment"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const search = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    const found = searchResults[0] || (await axiosInstance.get('/users/search', { params: { username: searchTerm.trim() } })).data.users?.[0]
    if (found) navigate(`/profile/${encodeURIComponent(found.username)}`)
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setSearchResults([])
      setSearchLoading(false)
    }
  }

  const openSearchResult = (result) => {
    setSearchTerm('')
    setSearchResults([])
    navigate(`/profile/${encodeURIComponent(result.username)}`)
  }

  const logout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return

    await axiosInstance.post('/users/logout').catch(() => undefined)
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white md:pb-0">
      {message && (
        <div role="status" className={`fixed right-4 top-24 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl ${message.toLowerCase().includes('unable') || message.toLowerCase().includes('failed') ? 'border-red-400/40 bg-red-950/90 text-red-200' : 'border-emerald-400/40 bg-emerald-950/90 text-emerald-200'}`}>
          <span className="mr-2">{message.toLowerCase().includes('unable') || message.toLowerCase().includes('failed') ? '⚠' : '✓'}</span>{message}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-4 sm:px-8">
          <Link to="/home" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 font-black">S</span>
            <span className="hidden sm:block">
              <b>SST Social</b>
              <small className="block text-slate-500">Your circle, your feed.</small>
            </span>
          </Link>
          <form onSubmit={search} className="relative mx-auto w-full max-w-xl">
            <input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search people or posts"
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
            />
            {searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/60">
                {searchLoading ? (
                  <p className="px-4 py-3 text-sm text-slate-400">Searching...</p>
                ) : searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      key={result._id || result.username}
                      type="button"
                      onClick={() => openSearchResult(result)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800"
                    >
                      <Avatar image={result.profileImage} name={result.name || result.username} className="h-9 w-9 text-xs" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-200">{result.name || result.username}</span>
                        <span className="block truncate text-sm text-slate-500">@{result.username}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-slate-500">No users found</p>
                )}
              </div>
            )}
          </form>
          <Link to={`/profile/${encodeURIComponent(user?.username || '')}`} className="flex items-center gap-2">
            <Avatar image={user?.profileImage} name={name} className="h-9 w-9 text-xs" />
            <b className="hidden sm:block">{user?.username || name}</b>
          </Link>
          <button type="button" onClick={logout} className="text-slate-400 hover:text-white">
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="social-layout mx-auto max-w-7xl px-4 py-7 sm:px-8">
        {/* Left Sidebar */}
        <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-900 p-3 md:sticky md:top-28">
          <Link to="/home" className="block rounded-2xl bg-indigo-500/15 px-4 py-3 text-indigo-300">
            ⌂ Home Feed
          </Link>
          <Link
            to={`/profile/${encodeURIComponent(user?.username || '')}`}
            className="mt-1 block rounded-2xl px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ◉ My Profile
          </Link>
          <Link to="/notifications" className="mt-1 flex items-center justify-between rounded-2xl px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white"><span>♡ Notifications</span>{unreadNotificationCount > 0 && <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-bold text-white">{unreadNotificationCount}</span>}</Link>
        </aside>

        {/* Center Feed */}
        <section className="min-w-0 space-y-6">
          {/* Stories Bar */}
          <section className="surface-card rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h1 className="text-2xl font-bold">Your Feed</h1>
            <p className="mt-1 text-slate-500">See what your circle is up to.</p>
            <div className="-mx-2 mt-6 flex items-start gap-5 overflow-x-auto px-2 pb-2 sm:mx-0 sm:px-0">
              <button type="button" onClick={() => ownStory ? openStoryGroup(ownGroup) : storyInputRef.current?.click()} className="group relative min-w-[88px] shrink-0 text-center">
                <span className={`relative mx-auto block h-[72px] w-[72px] rounded-full p-[3px] transition group-hover:scale-105 ${ownStory && ownGroup.items.some((story) => !viewedStories.has(story._id)) ? 'bg-gradient-to-tr from-indigo-400 via-violet-400 to-cyan-400' : 'bg-slate-600'}`}>
                  <Avatar image={ownStory?.image || user?.profileImage} name={name} className="h-full w-full border-2 border-slate-900" />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-500 text-sm font-bold text-white">+</span>
                </span>
                <small className="mt-3 block whitespace-nowrap text-center text-xs font-semibold text-slate-300">{ownStory ? `Your Story${ownGroup.items.length > 1 ? ` (${ownGroup.items.length})` : ''}` : '＋ Add story'}</small>
                {ownGroup?.items.length > 1 && <span className="absolute right-0 top-0 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-500 px-1 text-[10px] font-bold text-white">{ownGroup.items.length}</span>}
                <input ref={storyInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleStoryUpload} />
              </button>
              {ownStory && (
                <button type="button" onClick={() => storyInputRef.current?.click()} className="mt-8 h-9 shrink-0 rounded-full border border-slate-700 px-3 text-xs font-semibold text-slate-300 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-white">
                  ＋ Add another
                </button>
              )}
              {storyGroups.filter((group) => group.key !== ownGroup?.key).map((group) => {
                const story = group.items[0]
                const hasUnviewed = group.items.some((item) => !viewedStories.has(item._id))
                return <button type="button" key={group.key} onClick={() => openStoryGroup(group)} className="group min-w-[88px] shrink-0 text-center">
                  <span className={`relative mx-auto block h-[72px] w-[72px] rounded-full p-[3px] transition group-hover:scale-105 ${hasUnviewed ? 'bg-gradient-to-tr from-pink-400 via-violet-400 to-orange-300' : 'bg-slate-600'}`}>
                    <Avatar image={story.author?.profileImage} name={story.author?.name || story.author?.username} className="h-full w-full border-2 border-slate-900" />
                    {group.items.length > 1 && <span className="absolute right-0 top-0 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-500 px-1 text-[10px] font-bold text-white">{group.items.length}</span>}
                  </span>
                  <small className="mt-3 block max-w-24 truncate text-xs font-medium text-slate-300">{story.author?.name || story.author?.username}{group.items.length > 1 ? ` (${group.items.length})` : ''}</small>
                </button>
              })}
            </div>
          </section>

          {/* Create Post / Reel Box */}
          <section className="surface-card rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex gap-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => {
                  setContentType('post')
                  cancelVideoUpload()
                }}
                className={`rounded-lg px-4 py-2 font-medium transition ${
                  contentType === 'post' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                ▣ Post
              </button>
              <button
                type="button"
                onClick={() => {
                  setContentType('reel')
                  cancelImageUpload()
                }}
                className={`rounded-lg px-4 py-2 font-medium transition ${
                  contentType === 'reel' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                ▶ Reel
              </button>
            </div>

            <div className="flex gap-3">
              <Avatar image={user?.profileImage} name={name} />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={
                  contentType === 'post'
                    ? 'Write a caption for your image post...'
                    : 'Write a caption for your reel...'
                }
                className="min-h-20 flex-1 resize-none bg-transparent p-2 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Upload Previews with Cancel Button */}
            {contentType === 'post' && imagePreview && (
              <div className="relative mt-3 inline-block max-w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2">
                <img
                  src={imagePreview}
                  alt="Selected upload preview"
                  className="max-h-60 rounded-xl object-contain"
                />
                <button
                  type="button"
                  onClick={cancelImageUpload}
                  aria-label="Cancel image upload"
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg backdrop-blur-md transition hover:bg-red-600 hover:text-white"
                  title="Remove image"
                >
                  ✕
                </button>
                <div className="mt-1 flex items-center justify-between px-2 text-xs text-slate-400">
                  <span className="truncate max-w-[200px]">{image?.name}</span>
                  <button
                    type="button"
                    onClick={cancelImageUpload}
                    className="text-red-400 hover:underline hover:text-red-300 ml-2"
                  >
                    Cancel image
                  </button>
                </div>
              </div>
            )}

            {contentType === 'reel' && videoPreview && (
              <div className="relative mt-3 inline-block max-w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2">
                <video
                  src={videoPreview}
                  controls
                  className="max-h-60 rounded-xl object-contain bg-black"
                />
                <button
                  type="button"
                  onClick={cancelVideoUpload}
                  aria-label="Cancel video upload"
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg backdrop-blur-md transition hover:bg-red-600 hover:text-white"
                  title="Remove video"
                >
                  ✕
                </button>
                <div className="mt-1 flex items-center justify-between px-2 text-xs text-slate-400">
                  <span className="truncate max-w-[200px]">{video?.name}</span>
                  <button
                    type="button"
                    onClick={cancelVideoUpload}
                    className="text-red-400 hover:underline hover:text-red-300 ml-2"
                  >
                    Cancel video
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition">
                ＋ {contentType === 'post' ? 'Choose Image' : 'Choose Video'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={contentType === 'post' ? 'image/*' : 'video/*'}
                  className="hidden"
                  onChange={contentType === 'post' ? handleImageChange : handleVideoChange}
                />
              </label>
              {contentType === 'reel' && <span className="text-xs text-slate-500">Maximum 90 seconds</span>}

              <button
                type="button"
                disabled={submitting}
                onClick={contentType === 'post' ? createPost : createReel}
                className="rounded-xl bg-indigo-500 px-5 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
              >
                {submitting ? 'Publishing...' : `Create ${contentType === 'post' ? 'Post' : 'Reel'}`}
              </button>
            </div>

            {message && <p className="mt-3 text-sm font-medium text-indigo-300">{message}</p>}
          </section>

          {/* Posts List */}
          {posts.length ? (
            posts.map((post) => {
              const isAuthor = user && (post.author?._id === user._id || post.author?.username === user.username)
              return (
                <article id={`post-${post._id}`} key={post._id} className="surface-card scroll-mt-24 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                  <div className="flex items-center justify-between p-5">
                    <div
                      className="flex cursor-pointer items-center gap-3"
                      onClick={() =>
                        post.author?.username && navigate(`/profile/${encodeURIComponent(post.author.username)}`)
                      }
                    >
                      <Avatar
                        image={post.author?.profileImage}
                        name={post.author?.name || post.author?.username}
                      />
                      <div>
                        <b>{post.author?.name || post.author?.username}</b>
                        <p className="text-xs text-slate-500">@{post.author?.username}</p>
                      </div>
                    </div>

                    {/* Options for Author (Edit / Delete) */}
                    {isAuthor && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuPostId(openMenuPostId === post._id ? null : post._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                          aria-label="Post options"
                        >
                          •••
                        </button>

                        {openMenuPostId === post._id && (
                          <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-700 bg-slate-950 p-1.5 shadow-xl">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(post)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-indigo-500 hover:text-white"
                            >
                              ✎ Edit Post
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post._id)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            >
                              ✕ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {post.caption && <p className="px-5 pb-4 text-slate-300 whitespace-pre-wrap">{post.caption}</p>}
                  {post.image && (
                    <div className="flex max-h-[760px] w-full items-center justify-center bg-slate-950/40">
                      <img src={post.image} alt={post.caption || 'Post image'} className="block max-h-[760px] w-full object-contain" />
                    </div>
                  )}

                  {engagement(post, 'post')}
                </article>
              )
            })
          ) : (
            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
              Your feed is ready. Be the first to share something!
            </article>
          )}

          {/* Reels List */}
          {reels.map((reel) => {
            const isAuthor =
              user && (reel.author?._id === user._id || reel.author?.username === user.username)
            return (
              <article id={`reel-${reel._id}`} key={`reel-${reel._id}`} className="surface-card scroll-mt-24 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between p-5">
                  <div
                    className="flex cursor-pointer items-center gap-3"
                    onClick={() =>
                      reel.author?.username && navigate(`/profile/${encodeURIComponent(reel.author.username)}`)
                    }
                  >
                    <Avatar
                      image={reel.author?.profileImage}
                      name={reel.author?.name || reel.author?.username}
                    />
                    <div>
                      <b>{reel.author?.name || reel.author?.username}</b>
                      <p className="text-xs text-slate-500">@{reel.author?.username}</p>
                    </div>
                  </div>

                  {isAuthor && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuPostId(openMenuPostId === `reel-${reel._id}` ? null : `reel-${reel._id}`)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label="Reel options"
                      >
                        •••
                      </button>

                      {openMenuPostId === `reel-${reel._id}` && (
                        <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-700 bg-slate-950 p-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() => handleDeleteReel(reel._id)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            ✕ Delete Reel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="px-5 pb-4 text-slate-300">{reel.caption}</p>
                <video src={reel.video} controls className="max-h-[520px] w-full bg-black" />
                {engagement(reel, 'reel')}
              </article>
            )
          })}
        </section>

      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseEdit()
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Edit Post</h2>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Caption</label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Update your caption..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Post Image</label>
                <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
                  <img
                    src={editImagePreview || editingPost.image}
                    alt="Post preview"
                    className="max-h-56 w-full rounded-lg object-cover"
                  />
                  {editImage && (
                    <button
                      type="button"
                      onClick={cancelEditImage}
                      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-white shadow hover:bg-red-600"
                      title="Cancel new image"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition">
                    ✎ Change Image
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditImageChange}
                    />
                  </label>
                  {editImage && (
                    <span className="text-xs text-indigo-300">
                      New image selected (
                      <button
                        type="button"
                        onClick={cancelEditImage}
                        className="text-red-400 underline hover:text-red-300 ml-1"
                      >
                        Cancel
                      </button>
                      )
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveStory(null)}>
          <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setActiveStory(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-white">✕</button>
            <div className="absolute left-3 right-12 top-3 z-10 flex gap-1">
              {(activeGroup?.items || [activeStory]).map((story, index) => <span key={story._id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"><span style={index === activeStoryIndex ? { animationDuration: `${storyDuration}s` } : undefined} className={`block h-full rounded-full bg-white ${index < activeStoryIndex ? 'w-full' : index === activeStoryIndex ? 'story-progress-active' : 'w-0'}`} /></span>)}
            </div>
            <div className="absolute left-4 top-7 z-10 flex items-center gap-2 text-sm font-semibold text-white drop-shadow">
              <Avatar image={activeStory.author?.profileImage} name={activeStory.author?.name || activeStory.author?.username} className="h-8 w-8 border border-white/70" />
              {activeStory.author?.name || activeStory.author?.username}
            </div>
            <button type="button" aria-label="Previous story" onClick={() => moveStory(-1)} className="absolute left-2 top-1/2 z-10 rounded-full bg-black/40 px-3 py-2 text-xl text-white hover:bg-black/70">‹</button>
            <button type="button" aria-label="Next story" onClick={() => moveStory(1)} className="absolute right-2 top-1/2 z-10 rounded-full bg-black/40 px-3 py-2 text-xl text-white hover:bg-black/70">›</button>
            {activeStory.mediaType === 'video' ? (
              <video src={activeStory.video} controls autoPlay onLoadedMetadata={handleStoryVideoLoaded} onEnded={() => moveStory(1)} className="max-h-[75vh] w-full bg-black object-contain" />
            ) : (
              <img src={activeStory.image} alt={activeStory.caption || 'Story'} className="max-h-[75vh] w-full object-contain" />
            )}
            <div className="p-4"><div className="flex items-center justify-between"><b>{activeStory.author?.name || activeStory.author?.username}</b>{activeStory.author?.username === user?.username && <div className="flex gap-2"><button type="button" onClick={editStory} className="rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">Edit</button><button type="button" onClick={removeStory} className="rounded-lg bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">Delete</button></div>}</div>{activeStory.caption && <p className="mt-1 text-slate-300">{activeStory.caption}</p>}</div>
          </div>
        </div>
      )}
      <MobileNav username={user?.username} />
    </main>
  )
}

export default Home
