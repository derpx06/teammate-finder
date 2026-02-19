import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    Github,
    Lock,
    Loader2,
    Mail,
    Sparkles,
    Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, apiRequest } from '../config/api';

const SOCIAL_PROVIDERS = [
    {
        id: 'google',
        label: 'Google',
        icon: (
            <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5"
            />
        ),
    },
    {
        id: 'github',
        label: 'GitHub',
        icon: <Github className="h-5 w-5 text-slate-900" />,
    },
];

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [authError, setAuthError] = useState('');
    const navigate = useNavigate();

    const featurePoints = [
        'Find teammates with matching skills and availability',
        'Plan projects faster with AI-assisted role suggestions',
        'Collaborate in real-time with built-in team chat',
    ];

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        if (authError) {
            setAuthError('');
        }
    };

    const setMode = (loginMode) => {
        if (loading || isLogin === loginMode) return;
        setIsLogin(loginMode);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setErrors({});
        setAuthError('');
        setFormData({ email: '', password: '', confirmPassword: '' });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S/.test(formData.email)) newErrors.email = 'Email is invalid';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (!isLogin) {
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSocialAuth = (provider) => {
        window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            setAuthError('');

            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : {
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                };

            const response = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            localStorage.setItem('authToken', response.token);
            localStorage.setItem('authUser', JSON.stringify(response.user));

            navigate(isLogin ? '/dashboard' : '/onboarding');
        } catch (error) {
            setAuthError(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.45),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(165,243,252,0.45),transparent_38%),linear-gradient(180deg,#f2f7fb_0%,#f9fcff_42%,#ffffff_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl 2xl:max-w-screen-2xl flex-col px-4 py-6 sm:px-6 lg:flex-row lg:items-stretch lg:gap-8 lg:px-8 lg:py-8">
                <section className="hidden lg:flex lg:w-[52%]">
                    <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-950 px-10 py-10 text-white shadow-[0_22px_60px_-30px_rgba(2,6,23,0.85)]">
                        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
                        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_25%,rgba(56,189,248,0.15),transparent_45%),radial-gradient(circle_at_78%_74%,rgba(59,130,246,0.2),transparent_45%)]" />

                        <div className="relative z-10">
                            <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold text-white/95">
                                <Sparkles size={18} className="text-cyan-300" />
                                CollabSphere
                            </Link>
                            <h1 className="mt-8 max-w-lg text-4xl font-bold leading-tight text-white">
                                Build your next project with teammates who actually fit.
                            </h1>
                            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
                                Sign in to continue collaborating or create a new account to discover talent, launch faster, and stay aligned across every sprint.
                            </p>
                        </div>

                        <div className="relative z-10 mt-10 space-y-4">
                            {featurePoints.map((point) => (
                                <div
                                    key={point}
                                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                                    <p className="text-sm leading-relaxed text-slate-100/90">{point}</p>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 mt-8 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-cyan-200">Active Builders</p>
                                <p className="mt-1 text-2xl font-bold text-white">12k+</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 px-3 py-1.5 text-sm font-medium text-slate-100">
                                <Users size={14} className="text-cyan-300" />
                                93% match confidence
                            </div>
                        </div>
                    </div>
                </section>

                <section className="flex w-full items-center justify-center lg:w-[48%]">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_28px_72px_-38px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8"
                    >
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-100/85 p-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMode(true)}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode(false)}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>

                        <div className="mb-7">
                            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 sm:text-base">
                                {isLogin
                                    ? 'Use your email and password to continue.'
                                    : 'Join CollabSphere and start matching with teammates today.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="auth-email"
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={(e) => setField('email', e.target.value)}
                                        className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 ${errors.email ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-sm text-rose-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="auth-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        value={formData.password}
                                        onChange={(e) => setField('password', e.target.value)}
                                        className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 ${errors.password ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}
                                        placeholder="Enter at least 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-rose-600">{errors.password}</p>}
                            </div>

                            <AnimatePresence initial={false}>
                                {!isLogin && (
                                    <motion.div
                                        key="confirm-password"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <label htmlFor="auth-confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                            Confirm password
                                        </label>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="auth-confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setField('confirmPassword', e.target.value)}
                                                className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 ${errors.confirmPassword ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}
                                                placeholder="Re-enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="mt-1.5 text-sm text-rose-600">{errors.confirmPassword}</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isLogin && (
                                <div className="flex justify-end">
                                    <a href="#" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                                        Forgot password?
                                    </a>
                                </div>
                            )}

                            {authError && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                                    <p className="text-sm text-rose-700">{authError}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-3 text-base font-semibold text-white shadow-[0_18px_34px_-20px_rgba(14,116,255,0.95)] transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {SOCIAL_PROVIDERS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        type="button"
                                        onClick={() => handleSocialAuth(provider.id)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        {provider.icon}
                                        {provider.label}
                                    </button>
                                ))}
                            </div>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-600">
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                type="button"
                                onClick={() => setMode(!isLogin)}
                                className="font-semibold text-blue-700 transition hover:text-blue-800"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </motion.div>
                </section>
            </div>
        </div>
    );
};

export default Auth;
