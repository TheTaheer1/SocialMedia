import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

function MobileNav({ username }) {
  const unreadCount = useSelector((state) => state.notification.unreadCount)
  const links = [
    { to: '/home', label: 'Home', icon: '⌂' },
    { to: '/notifications', label: 'Alerts', icon: '♡', badge: unreadCount },
    { to: `/profile/${encodeURIComponent(username || '')}`, label: 'Profile', icon: '◉' }
  ]
  return <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, width: '100vw' }} className="mobile-bottom-nav z-40 grid grid-cols-3 rounded-t-2xl border border-b-0 border-slate-700/80 bg-slate-900/95 p-2 pb-2 shadow-2xl shadow-slate-950/60 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
    {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] font-semibold ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}><span className="text-lg leading-none">{link.icon}</span>{link.label}{link.badge > 0 && <span className="absolute right-4 top-1 rounded-full bg-indigo-500 px-1.5 text-[9px] text-white">{link.badge}</span>}</NavLink>)}
  </nav>
}

export default MobileNav
