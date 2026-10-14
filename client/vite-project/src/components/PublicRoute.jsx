import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function PublicRoute() {
  const { user } = useAuth()

  // Public pages should render immediately. The background /me check only
  // redirects an already-authenticated user once it finishes.
  return user ? <Navigate to="/home" replace /> : <Outlet />
}

export default PublicRoute
