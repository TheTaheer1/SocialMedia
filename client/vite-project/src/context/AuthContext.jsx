import { useEffect, useState } from 'react'
import { axiosInstance } from '../axiosCalls/axios'
import { AuthContext } from './authContext'
import { useDispatch } from 'react-redux'
import { setAuthUser } from '../redux/authSlice'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    let mounted = true
    const fallbackTimer = window.setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 5000)

    const loadUser = async () => {
      try {
        const response = await axiosInstance.get('/users/me')
        if (!mounted) return
        setUser(response.data.userData)
        dispatch(setAuthUser(response.data.userData))
      } catch {
        if (!mounted) return
        setUser(null)
        dispatch(setAuthUser(null))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadUser()
    return () => {
      mounted = false
      window.clearTimeout(fallbackTimer)
    }
  }, [dispatch])

  const updateUser = (value) => {
    setUser((current) => {
      const next = typeof value === 'function' ? value(current) : value
      dispatch(setAuthUser(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
