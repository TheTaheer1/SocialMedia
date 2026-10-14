import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/useAuth'
import { useDispatch } from 'react-redux'
import { setProfileRedux } from '../redux/profileSlice'
import { setPostsRedux } from '../redux/postSlice'
import { setReelsRedux } from '../redux/reelSlice'
import MobileNav from '../components/MobileNav'

function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: loggedInUser, setUser } = useAuth()
  const dispatch = useDispatch()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('posts')
  const [relationshipTab, setRelationshipTab] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: ''
  })
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [previewImage, setPreviewImage] = useState('')
  const [removeProfileImage, setRemoveProfileImage] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Edit Post State
  const [editingPost, setEditingPost] = useState(null)
  const [editPostCaption, setEditPostCaption] = useState('')
  const [editPostImageFile, setEditPostImageFile] = useState(null)
  const [editPostImagePreview, setEditPostImagePreview] = useState('')
  const [savePostLoading, setSavePostLoading] = useState(false)
  const [editingReel, setEditingReel] = useState(null)
  const [editReelCaption, setEditReelCaption] = useState('')
  const [editReelVideoFile, setEditReelVideoFile] = useState(null)
  const [editReelVideoPreview, setEditReelVideoPreview] = useState('')
  const [saveReelLoading, setSaveReelLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      setProfile(null)
      setError('')

      try {
        const [profileResult, postsResult, reelsResult] = await Promise.allSettled([
          axiosInstance.get(`/users/profile/${encodeURIComponent(username)}`),
          axiosInstance.get('/posts/getAllPosts'),
          axiosInstance.get(`/reels/user/${encodeURIComponent(username)}`).catch(() => axiosInstance.get('/reels/getAllReels'))
        ])
        if (profileResult.status !== 'fulfilled') {
          throw profileResult.reason
        }
        const profileResponse = profileResult.value
        const profileData = profileResponse.data.profileData
        const posts = postsResult.status === 'fulfilled'
          ? (postsResult.value.data.posts || []).filter((post) => post.author?.username === profileData.username)
          : (profileData.posts || [])
        const reels = reelsResult.status === 'fulfilled'
          ? (reelsResult.value.data.reels || []).filter((reel) => reel.author?.username === profileData.username)
          : (profileData.reels || [])
        setProfile({ ...profileData, posts, reels })
        dispatch(setProfileRedux({ ...profileData, posts, reels }))
        dispatch(setPostsRedux(posts))
        dispatch(setReelsRedux(reels))
        setIsFollowing(profileResponse.data.isFollowing)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load profile.')
      }
    }

    loadProfile()
  }, [username, dispatch])

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage])

  const isOwnProfile = loggedInUser?.username === profile?.username

  const handleFollow = async () => {
    setFollowLoading(true)
    setError('')

    try {
      const response = await axiosInstance.post(`/users/follow/${encodeURIComponent(username)}`)
      setProfile(response.data.profileData)
      setIsFollowing(response.data.isFollowing)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update follow status.')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setFollowLoading(true)
    setError('')

    try {
      const response = await axiosInstance.delete(`/users/follow/${encodeURIComponent(username)}`)
      setProfile(response.data.profileData)
      setIsFollowing(response.data.isFollowing)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update follow status.')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleOpenEditModal = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || ''
      })
      setPreviewImage(profile.profileImage || '')
      setSelectedImageFile(null)
      setRemoveProfileImage(false)
      setError('')
      setIsEditModalOpen(true)
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedImageFile(null)
    setRemoveProfileImage(false)
    setPreviewImage(profile?.profileImage || '')
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.')
      return
    }

    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage)
    }

    setSelectedImageFile(file)
    setRemoveProfileImage(false)
    setPreviewImage(URL.createObjectURL(file))
  }

  const cancelProfilePhotoSelection = () => {
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage)
    }
    setSelectedImageFile(null)
    setPreviewImage(profile?.profileImage || '')
  }

  const removeProfilePhoto = () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return

    if (previewImage?.startsWith('blob:')) URL.revokeObjectURL(previewImage)
    setSelectedImageFile(null)
    setPreviewImage('')
    setRemoveProfileImage(true)
  }

  const handleOpenEditPost = (post) => {
    setEditingPost(post)
    setEditPostCaption(post.caption || '')
    setEditPostImageFile(null)
    setEditPostImagePreview('')
  }

  const handleCloseEditPost = () => {
    if (editPostImagePreview && editPostImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPostImagePreview)
    }
    setEditingPost(null)
    setEditPostCaption('')
    setEditPostImageFile(null)
    setEditPostImagePreview('')
  }

  const handlePostImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (editPostImagePreview && editPostImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPostImagePreview)
    }
    setEditPostImageFile(file)
    setEditPostImagePreview(URL.createObjectURL(file))
  }

  const cancelEditPostImage = () => {
    if (editPostImagePreview && editPostImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editPostImagePreview)
    }
    setEditPostImageFile(null)
    setEditPostImagePreview('')
  }

  const handleSavePostEdit = async () => {
    if (!editingPost) return
    if (!editPostCaption.trim()) {
      setError('Caption cannot be empty.')
      return
    }

    setSavePostLoading(true)
    const formData = new FormData()
    formData.append('caption', editPostCaption)
    if (editPostImageFile) {
      formData.append('image', editPostImageFile)
    }

    try {
      const res = await axiosInstance.put(`/posts/update/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => axiosInstance.put(`/posts/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }))

      const updated = res.data.post
      setProfile((prev) => ({
        ...prev,
        posts: (prev.posts || []).map((p) => (p._id === updated._id ? updated : p))
      }))
      handleCloseEditPost()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update post.')
    } finally {
      setSavePostLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await axiosInstance.delete(`/posts/${postId}`)
      setProfile((prev) => ({
        ...prev,
        posts: (prev.posts || []).filter((p) => p._id !== postId)
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete post.')
    }
  }

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return
    try {
      await axiosInstance.delete(`/reels/${reelId}`)
      setProfile((prev) => ({
        ...prev,
        reels: (prev.reels || []).filter((r) => r._id !== reelId)
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete reel.')
    }
  }

  const handleOpenEditReel = (reel) => {
    setEditingReel(reel)
    setEditReelCaption(reel.caption || '')
    setEditReelVideoFile(null)
    setEditReelVideoPreview('')
  }

  const handleCloseEditReel = () => {
    if (editReelVideoPreview?.startsWith('blob:')) URL.revokeObjectURL(editReelVideoPreview)
    setEditingReel(null)
    setEditReelCaption('')
    setEditReelVideoFile(null)
    setEditReelVideoPreview('')
  }

  const handleReelVideoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('video/')) return setError('Please choose a valid video file.')
    if (editReelVideoPreview?.startsWith('blob:')) URL.revokeObjectURL(editReelVideoPreview)
    setEditReelVideoFile(file)
    setEditReelVideoPreview(URL.createObjectURL(file))
  }

  const handleSaveReelEdit = async () => {
    if (!editingReel || !editReelCaption.trim()) return setError('Caption cannot be empty.')
    setSaveReelLoading(true)
    const payload = new FormData()
    payload.append('caption', editReelCaption)
    if (editReelVideoFile) payload.append('video', editReelVideoFile)
    try {
      const response = await axiosInstance.put(`/reels/update/${editingReel._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      const updated = response.data.reel
      setProfile((current) => ({ ...current, reels: (current.reels || []).map((reel) => reel._id === updated._id ? updated : reel) }))
      handleCloseEditReel()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update reel.')
    } finally {
      setSaveReelLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    const payload = new FormData()
    payload.append('name', formData.name)
    payload.append('username', formData.username)
    payload.append('email', formData.email)
    payload.append('bio', formData.bio)
    payload.append('removeProfileImage', String(removeProfileImage))

    if (selectedImageFile) {
      payload.append('profileImage', selectedImageFile)
    }

    setSaveLoading(true)
    setError('')

    try {
      const response = await axiosInstance.post('/users/updateProfile', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const updatedUser = response.data.userData
      setProfile(updatedUser)
      setUser(updatedUser)
      setIsEditModalOpen(false)

      if (updatedUser.username && updatedUser.username !== username) {
        navigate(`/profile/${encodeURIComponent(updatedUser.username)}`)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile.')
    } finally {
      setSaveLoading(false)
    }
  }

  const initials = useMemo(() => {
    if (!profile?.name) return '?'

    return profile.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [profile])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-xl font-semibold">Profile unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link
            to="/home"
            className="mt-6 inline-flex rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400"
          >
            Back home
          </Link>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <p>Loading profile...</p>
      </main>
    )
  }

  const content = activeTab === 'posts' ? profile.posts : profile.reels
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    : 'Recently joined'

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-950 px-4 py-6 pb-24 text-white sm:px-8 md:pb-6">
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <Link to="/home" className="inline-flex items-center text-sm text-slate-400 hover:text-white">
          ← Back home
        </Link>

        <section className="mt-6 w-full min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-indigo-950/20">
          <div className="h-32 bg-linear-to-r from-indigo-600 via-violet-500 to-cyan-400 sm:h-44" />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex min-w-0 flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-indigo-500 text-2xl font-bold text-white sm:h-32 sm:w-32 sm:text-4xl">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={`${profile.name}'s avatar`}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-2xl font-bold sm:text-3xl">{profile.name}</h1>
                  <p className="truncate text-sm text-slate-400">@{profile.username}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                  >
                    Edit profile
                  </button>
                ) : isFollowing ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-indigo-400 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200"
                    >
                      {followLoading ? 'Updating...' : 'Following'}
                    </button>
                    <button
                      type="button"
                      onClick={handleUnfollow}
                      disabled={followLoading}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {followLoading ? 'Updating...' : 'Unfollow'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {followLoading ? 'Updating...' : 'Follow'}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Profile settings"
                  className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                >
                  ...
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-800 py-4 text-center sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('posts')
                  window.setTimeout(() => document.getElementById('profile-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
                }}
                className="rounded-xl px-2 py-1 transition hover:bg-slate-800"
              >
                <p className="text-lg font-bold">{profile.posts?.length || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Posts</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reels')
                  window.setTimeout(() => document.getElementById('profile-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
                }}
                className="rounded-xl px-2 py-1 transition hover:bg-slate-800"
              >
                <p className="text-lg font-bold">{profile.reels?.length || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Reels</p>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipTab('followers')}
                className="rounded-xl px-2 py-1 transition hover:bg-slate-800"
              >
                <p className="text-lg font-bold">{profile.followers?.length || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Followers</p>
              </button>
              <button
                type="button"
                onClick={() => setRelationshipTab('followings')}
                className="rounded-xl px-2 py-1 transition hover:bg-slate-800"
              >
                <p className="text-lg font-bold">{profile.followings?.length || 0}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">Following</p>
              </button>
            </div>

            {relationshipTab && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200">
                    {relationshipTab === 'followers' ? 'People following' : 'People you follow'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRelationshipTab(null)}
                    className="text-sm text-slate-500 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                {(profile[relationshipTab] || []).length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile[relationshipTab].map((person) => (
                      <button
                        type="button"
                        key={person._id || person.username}
                        onClick={() => person.username && navigate(`/profile/${encodeURIComponent(person.username)}`)}
                        className="flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-800"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500 font-bold">
                          {person.profileImage ? (
                            <img src={person.profileImage} alt={`${person.name || person.username} avatar`} className="h-full w-full object-cover" />
                          ) : (
                            (person.name || person.username || '?').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-200">{person.name || person.username}</span>
                          <span className="block truncate text-sm text-slate-500">@{person.username}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No {relationshipTab === 'followers' ? 'followers' : 'following'} yet.</p>
                )}
              </div>
            )}

            <div className="mt-5 space-y-2 text-sm text-slate-300">
              {profile.bio ? <p className="text-slate-200">{profile.bio}</p> : null}
              <p>{profile.email}</p>
              <p className="text-slate-500">Joined {joinedDate}</p>
            </div>
          </div>
        </section>

        <section id="profile-content" className="mt-6 w-full min-w-0 scroll-mt-6 rounded-3xl border border-slate-800 bg-slate-900">
          <div className="flex border-b border-slate-800">
            {['posts', 'reels'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 border-b-2 px-4 py-4 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'posts' ? 'Posts' : 'Reels'} ({profile[tab]?.length || 0})
              </button>
            ))}
          </div>

          <div className="px-5 py-12 text-center sm:px-8">
            {content?.length ? (
              <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3">
                {content.map((item) => (
                  <article
                    key={item._id || item}
                    onClick={() => navigate(`/home#${activeTab === 'posts' ? 'post' : 'reel'}-${item._id}`)}
                    className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400"
                    title={`Open ${activeTab === 'posts' ? 'post' : 'reel'}`}
                  >
                    {activeTab === 'posts' && item.image ? (
                      <img src={item.image} alt={item.caption || 'Post'} className="aspect-[4/5] w-full object-cover" />
                    ) : activeTab === 'reels' && item.video ? (
                      <video src={item.video} controls onClick={(event) => event.stopPropagation()} className="aspect-[4/5] w-full bg-black object-cover" />
                    ) : null}
                    {item.caption && <p className="line-clamp-2 border-t border-slate-700/60 px-3 py-3 text-sm text-slate-300">{item.caption}</p>}

                    {isOwnProfile && activeTab === 'posts' && (
                      <div onClick={(event) => event.stopPropagation()} className="mt-auto flex items-center justify-end gap-2 border-t border-slate-700/60 bg-slate-900/60 p-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPost(item)}
                          className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500 hover:text-white transition"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(item._id)}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    )}

                    {isOwnProfile && activeTab === 'reels' && (
                      <div onClick={(event) => event.stopPropagation()} className="mt-auto flex items-center justify-end gap-2 border-t border-slate-700/60 bg-slate-900/60 p-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditReel(item)}
                          className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500 hover:text-white"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReel(item._id)}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white transition"
                        >
                          ✕ Delete Reel
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <>
                <p className="font-semibold text-slate-200">No {activeTab} yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  This space will show {activeTab} when they are shared.
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditModal()
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit profile</h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-200">{initials}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
                    Change photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {selectedImageFile && (
                    <button
                      type="button"
                      onClick={cancelProfilePhotoSelection}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-slate-800"
                    >
                      Cancel photo
                    </button>
                  )}
                  {previewImage && !selectedImageFile && (
                    <button
                      type="button"
                      onClick={removeProfilePhoto}
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Bio</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(event) => setFormData((current) => ({ ...current, bio: event.target.value }))}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500"
                  placeholder="Tell people about yourself"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseEditPost()
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Edit Post</h2>
              <button
                type="button"
                onClick={handleCloseEditPost}
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
                  value={editPostCaption}
                  onChange={(e) => setEditPostCaption(e.target.value)}
                  placeholder="Update your caption..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Post Image</label>
                <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
                  <img
                    src={editPostImagePreview || editingPost.image}
                    alt="Post preview"
                    className="max-h-56 w-full rounded-lg object-cover"
                  />
                  {editPostImageFile && (
                    <button
                      type="button"
                      onClick={cancelEditPostImage}
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
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePostImageChange}
                    />
                  </label>
                  {editPostImageFile && (
                    <span className="text-xs text-indigo-300">
                      New image selected (
                      <button
                        type="button"
                        onClick={cancelEditPostImage}
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
                onClick={handleCloseEditPost}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePostEdit}
                disabled={savePostLoading}
                className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {savePostLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
          onMouseDown={(event) => event.target === event.currentTarget && handleCloseEditReel()}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Edit Reel</h2>
              <button type="button" onClick={handleCloseEditReel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
            </div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Caption</label>
            <textarea
              rows={4}
              value={editReelCaption}
              onChange={(event) => setEditReelCaption(event.target.value)}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-indigo-500"
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-700 bg-black">
              <video src={editReelVideoPreview || editingReel.video} controls className="max-h-64 w-full object-contain" />
            </div>
            <label className="mt-3 inline-flex cursor-pointer rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">
              ✎ Change Video
              <input type="file" accept="video/*" className="hidden" onChange={handleReelVideoChange} />
            </label>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={handleCloseEditReel} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancel</button>
              <button type="button" onClick={handleSaveReelEdit} disabled={saveReelLoading} className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
                {saveReelLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileNav username={loggedInUser?.username} />
    </main>
  )
}

export default Profile
