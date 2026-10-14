import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'

function Signup() {
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    })

    const [loader, setLoader] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setError('')
        setSuccess('')

        if (Object.values(form).some((value) => !value.trim())) {
            setError('All fields are required.')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Please enter a valid email address.')
            return
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        setLoader(true)

        try {
            const response = await axiosInstance.post(
                '/users/register',
                form
            )

            console.log(response.data)

            setSuccess('User registered successfully!')

            setForm({
                name: '',
                username: '',
                email: '',
                password: ''
            })

            navigate('/login')

        } catch (error) {
            console.log(error)

            // Backend error message
            setError(
                error.response?.data?.message ||
                'Something went wrong. Please try again.'
            )

        } finally {
            setLoader(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
            <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-indigo-950/30">

                {/* Branding & Header */}
                <div className="text-center">
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
                        Join SST Social
                    </h1>

                    <p className="mt-1 text-sm text-slate-300">
                        Connect seamlessly. Share effortlessly.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="rounded-xl border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
                        {success}
                    </div>
                )}

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    className="mt-8 space-y-4"
                >

                    {/* Name */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Full Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            disabled={loader}
                            autoComplete="off"
                            placeholder="e.g. Alex Morgan"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Username
                        </label>

                        <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-slate-500">
                                @
                            </span>

                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                disabled={loader}
                                autoComplete="off"
                                placeholder="alexmorgan"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    {/* Email */}
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

                    {/* Password */}
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
                            placeholder="Create a password"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁'}</button>
                        </div>
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loader}
                        className="mt-2 w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-all hover:bg-indigo-400 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loader ? 'Creating Account...' : 'Create Account'}
                    </button>

                </form>

                {/* Footer */}
                <div className="border-t border-slate-800 pt-6 text-center">
                    <p className="text-sm text-slate-400">
                        Already part of the community?{' '}

                        <Link
                            to="/login"
                            className="font-semibold text-indigo-300 hover:text-indigo-200 hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Signup
