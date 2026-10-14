import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'
import { useAuth } from '../context/useAuth'

function Login() {

    const [form, setForm] = useState({
        email: '',
        password: ''
    })

    const [loader, setLoader] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate()
    const { setUser } = useAuth()


    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }


    const handleSubmit = async (e) => {

        // Prevent page from refreshing
        e.preventDefault()

        // Remove previous error before making a new request
        setError('')

        if (!form.email.trim() || !form.password) {
            setError('Email and password are required.')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Please enter a valid email address.')
            return
        }

        // Start loading
        setLoader(true)

        try {

            // Send login data to backend
            const response = await axiosInstance.post('/users/login', form)

            setUser(response.data.userData)

            console.log("User Logged in")

            navigate(`/profile/${encodeURIComponent(response.data.userData.username)}`)

        } catch (error) {

            console.log(error)

            // Get error message sent by backend
            // If backend doesn't send a message,
            // show the default message
            setError(
                error.response?.data?.message ||
                'Login failed. Please check your email and password.'
            )

        } finally {

            // Stop loading whether request succeeds or fails
            setLoader(false)
        }
    }


    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">

            <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-indigo-950/30">

                {/* Branding & Header */}
                <div className="text-center">

                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
                        Log in to SST Social
                    </h1>

                    <p className="mt-1 text-sm text-slate-300">
                        Connect seamlessly. Share effortlessly.
                    </p>

                </div>


                {/* ERROR MESSAGE */}
                {error && (
                    <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}


                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    className="mt-8 space-y-4"
                >

                    {/* Email Field */}
                    <div>

                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Email Address
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            disabled={loader}
                            autoComplete="off"
                            placeholder="alex@example.com"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />

                    </div>


                    {/* Password Field */}
                    <div>

                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Password
                        </label>

                        <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            disabled={loader}
                            autoComplete="new-password"
                            placeholder="Password"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁'}</button>
                        </div>

                    </div>


                    {/* Login Button */}
                    <button
                        type="submit"

                        // Disable button while API request is running
                        disabled={loader}

                        className="mt-2 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-all hover:bg-indigo-400 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {/* Show different text while loading */}
                        {loader ? 'Logging in...' : 'Log in'}

                    </button>

                </form>


                {/* Footer / Signup Link */}
                <div className="border-t border-slate-800 pt-6 text-center">

                    <p className="text-sm text-slate-400">

                        New User, Please{' '}

                        <Link
                            to="/signup"
                            className="font-semibold text-indigo-300 hover:text-indigo-200 hover:underline"
                        >
                            Sign up
                        </Link>

                    </p>

                </div>

            </div>

        </div>
    )
}

export default Login
