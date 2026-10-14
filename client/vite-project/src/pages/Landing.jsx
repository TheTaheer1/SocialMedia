import { Link } from 'react-router-dom'

function Landing() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="text-2xl font-black tracking-tight text-white">
          SST <span className="text-indigo-400">Social</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 py-20 lg:px-10">
        <div className="mx-auto text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
            Your people. Your space.
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Share the moments that matter.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Connect with friends, discover new voices, and keep your everyday stories in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-indigo-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400"
            >
              Create your account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:bg-white/5"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Landing