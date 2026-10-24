import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import StarField from '../../components/signup_page/StarField';
import WelcomeLine from '../../components/signup_page/WelcomeLine';
import FieldError from '../../components/signup_page/FieldError';
import PasswordField from '../../components/signup_page/PasswordField';
import googleIcon from '../../assets/logos/google.svg';
import codeSarthi from '../../assets/logos/codesarthi.svg';
import arrowBack from '../../assets/icons/arrowback.svg';
import { getApiUrl } from '../../utils/config';

const SignUp = () => {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setApiError('');
        setIsSubmitting(true);
        setIsLoading(true);
        try {
            const response = await fetch(getApiUrl('/api/auth/signup'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                setApiError(result.message || 'Signup failed. Please try again.');
                setIsLoading(false);
                return;
            }
            console.log("Signup successful: ", result);
            localStorage.setItem('token', result.token);
            navigate('/dashboard');
        }
        catch (error) {
            console.error("Network error: ", error);
            setApiError('Unable to connect to server. Please verify your internet connection or try again later.');
            setIsLoading(false);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-black min-h-screen text-ink font-body flex flex-col lg:flex-row w-full overflow-x-hidden relative">
            {/* Fullscreen Loading Screen Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-modal-backdrop">
                    <div className="flex flex-col items-center max-w-sm w-full text-center animate-modal-content">
                        {/* Spinning indicator with brand initials */}
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                            <div className="absolute font-display font-bold text-sm text-white select-none">
                                EX
                            </div>
                        </div>

                        <span className="text-metallic font-display font-bold text-2xl tracking-tight select-none mb-2">
                            Evolexa
                        </span>
                        <p className="text-ink font-sans text-sm font-medium mb-1">
                            Creating your account...
                        </p>
                        <p className="text-muted text-xs font-mono">
                            Setting up your workspace
                        </p>
                    </div>
                </div>
            )}

            {/* Left Column - Desktop branding sidebar */}
            <div className="hidden lg:flex lg:w-[38vw] xl:w-[35vw] shrink-0 auth-sidebar-bg min-h-screen flex-col justify-between p-8 xl:p-12 border-r border-white/10">
                <Link to="/" className="inline-flex items-center gap-2 max-w-fit px-3 py-1.5 font-display text-base text-muted-light hover:text-ink hover:bg-white/5 rounded-xl transition-all">
                    <img src={arrowBack} className="h-4 w-4" alt="Back" /> Home
                </Link>
                <div className="my-auto py-12">
                    <div className="flex flex-col gap-3">
                        <span className="w-fit text-metallic font-bold tracking-tight font-display text-4xl xl:text-5xl select-none [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.35))_drop-shadow(0_0_18px_rgba(255,255,255,0.15))]">
                            Evolexa
                        </span>
                        <span className="text-ink font-display font-bold text-2xl xl:text-3xl tracking-tight leading-snug">
                            <WelcomeLine />
                        </span>
                    </div>
                    <div className="mt-8 text-muted-light text-base xl:text-lg leading-relaxed max-w-md">
                        Turns job-hunt chaos into something that looks actually manageable.
                    </div>
                </div>
                <div className="text-muted text-sm">
                    <p className="font-semibold text-ink mb-1">Trusted by job seekers applying to</p>
                    <p className="font-mono text-xs text-muted/70">Google · Stripe · Vercel · Meta</p>
                </div>
            </div>

            {/* Right Column - Form Container */}
            <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 auth-form-bg relative overflow-y-auto">
                <StarField />

                {/* Mobile header */}
                <div className="lg:hidden w-full max-w-md flex items-center justify-between mb-6 z-10">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-display text-muted-light hover:text-ink">
                        <img src={arrowBack} className="h-4 w-4" alt="Back" /> Home
                    </Link>
                    <span className="text-metallic font-bold font-display text-2xl">
                        Evolexa
                    </span>
                </div>

                <div className="w-full max-w-md sm:max-w-lg z-10 flex flex-col items-center">
                    <h1 className="heading mb-6 font-display font-bold text-center text-3xl sm:text-4xl text-white tracking-tight">
                        Create new account
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
                        {apiError && (
                            <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center">
                                {apiError}
                            </div>
                        )}
                        {/* Name fields row */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-start">
                            <div className="flex flex-col relative">
                                <span className="font-mono m-1 text-[13px]">First name</span>
                                <input {...register('firstname', {
                                    required: "First name is required",
                                    pattern: {
                                        value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                        message: "Enter a valid name"
                                    }
                                })} type="text" placeholder="Monkey" className={`p-2.5 h-11 w-full border rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors ${errors.firstname ? 'border-red-500' : 'border-white/10'}`} />
                                <FieldError message={errors.firstname?.message} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono m-1 text-[13px]">Middle name</span>
                                <input {...register('midname')} type="text" placeholder="D." className="p-2.5 h-11 w-full border border-white/10 rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors" />
                            </div>
                            <div className="flex flex-col relative">
                                <span className="font-mono m-1 text-[13px]">Last name</span>
                                <input {...register('lastname', {
                                    required: "Last name is required",
                                    pattern: {
                                        value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                        message: "Enter a valid name"
                                    }
                                })} type="text" placeholder="Luffy" className={`p-2.5 h-11 w-full border rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors ${errors.lastname ? 'border-red-500' : 'border-white/10'}`} />
                                <FieldError message={errors.lastname?.message} />
                            </div>
                        </div>

                        {/* Email & Username */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 items-start">
                            <div className="relative flex flex-col">
                                <span className="font-mono m-1 text-[13px]">Email</span>
                                <input {...register('email', {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Enter a valid email"
                                    }
                                })} type="text" placeholder="example123@xyz.com" className={`p-2.5 h-11 w-full border rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors ${errors.email ? 'border-red-500' : 'border-white/10'}`} />
                                <FieldError message={errors.email?.message} />
                            </div>
                            <div className="relative flex flex-col">
                                <span className="font-mono m-1 text-[13px]">Username</span>
                                <input {...register('username', {
                                    required: "Username is required",
                                    pattern: {
                                        value: /^[a-z][a-z0-9_.\-]*$/,
                                        message: "Enter a valid username"
                                    }
                                })} type="text" placeholder="username_123" className={`p-2.5 h-11 w-full border rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors ${errors.username ? 'border-red-500' : 'border-white/10'}`} />
                                <FieldError message={errors.username?.message} />
                            </div>
                        </div>

                        {/* Passwords */}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 items-start">
                            <PasswordField
                                label="Password"
                                placeholder="Enter password"
                                name="password"
                                register={register}
                                error={errors.password}
                                width="w-full"
                                rules={{
                                    required: "Password is required",
                                    minLength: {
                                        value: 8,
                                        message: "Password must have at least 8 characters"
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                        message: 'Needs 1 uppercase, lowercase, number, symbol'
                                    }
                                }}
                            />
                            <PasswordField
                                label="Confirm password"
                                placeholder="Confirm password"
                                name="confirmPassword"
                                register={register}
                                error={errors.confirmPassword}
                                width="w-full"
                                rules={{
                                    required: "Please confirm your password",
                                    validate: (value) => value === watch("password") || "Passwords do not match"
                                }}
                            />
                        </div>

                        {/* Buttons & OAuth Links */}
                        <div className="mt-6 w-full flex flex-col items-center gap-3.5">
                            <div className="flex items-center justify-between gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => { reset() }}
                                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#18181b] hover:bg-[#222227] border border-white/10 hover:border-white/20 text-ink cursor-pointer shadow-sm hover:shadow-md hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isLoading}
                                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-ink hover:bg-ink-dark text-black cursor-pointer shadow-md shadow-ink/25 hover:shadow-md hover:shadow-ink/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isLoading ? 'Creating...' : 'Submit'}
                                </button>
                            </div>

                            <div className="w-full flex items-center my-1">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="px-3 text-xs text-muted font-mono uppercase">or</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            <Link to="/" className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#18181b] hover:bg-[#222227] border border-white/10 hover:border-white/20 text-ink shadow-sm hover:shadow-md hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100">
                                <img src={googleIcon} alt="" className="mr-2 h-4 w-4" /> Continue with Google
                            </Link>

                            <Link to="/" className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#18181b] hover:bg-[#222227] border border-white/10 hover:border-white/20 text-ink shadow-sm hover:shadow-md hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100">
                                <img src={codeSarthi} alt="" className="mr-2 h-4 w-4 brightness-0 invert" /> Continue with CodeSarthi
                            </Link>

                            <Link to="/login" className="mt-1 text-sm text-muted-light hover:text-white hover:underline font-mono transition-colors">
                                Already a user?
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SignUp