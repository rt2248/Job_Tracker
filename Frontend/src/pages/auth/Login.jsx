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

const Login = () => {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        try {
            const response = await fetch(getApiUrl('/api/auth/login'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                setApiError(result.message || 'Login failed. Please check your credentials.');
                return;
            }
            console.log("Login successful: ", result);
            localStorage.setItem('token', result.token);
            navigate('/dashboard');
        }
        catch (error) {
            console.error("Network error: ", error);
            setApiError('Unable to connect to server. Please verify your internet connection or try again later.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-canvas min-h-screen text-ink font-body flex flex-col lg:flex-row w-full overflow-x-hidden">
            {/* Left Column - Desktop branding sidebar */}
            <div className="hidden lg:flex lg:w-[38vw] xl:w-[35vw] shrink-0 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] min-h-screen flex-col justify-between p-8 xl:p-12 border-r border-indigo/15">
                <Link to="/" className="inline-flex items-center gap-2 max-w-fit px-3 py-1.5 font-display text-base text-muted-light hover:text-ink hover:bg-indigo/10 rounded-xl transition-all">
                    <img src={arrowBack} className="h-4 w-4" alt="Back" /> Home
                </Link>
                <div className="my-auto py-12">
                    <div className="flex flex-col gap-3">
                        <span className="w-fit bg-gradient-to-tr from-cyan to-ink font-bold bg-clip-text text-transparent tracking-tight font-display text-4xl xl:text-5xl [filter:drop-shadow(0_0_8px_rgba(34,211,238,0.4))]">
                            JobTracker
                        </span>
                        <span className="text-ink font-display font-bold text-2xl xl:text-3xl tracking-tight leading-snug">
                            <WelcomeLine />
                        </span>
                    </div>
                    <div className="mt-8 text-muted-light text-base xl:text-lg leading-relaxed max-w-md">
                        Turns job-hunt chaos into something that looks actually manageable.
                    </div>
                </div>
                <div className="text-muted-light text-sm">
                    <p className="font-semibold text-ink mb-1">Trusted by job seekers applying to</p>
                    <p className="font-mono text-xs text-muted">Google · Stripe · Vercel · Meta</p>
                </div>
            </div>

            {/* Right Column - Form Container */}
            <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-surface/30 relative">
                <StarField />
                
                {/* Mobile back link & logo header */}
                <div className="lg:hidden w-full max-w-md flex items-center justify-between mb-8 z-10">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-display text-muted-light hover:text-ink">
                        <img src={arrowBack} className="h-4 w-4" alt="Back" /> Home
                    </Link>
                    <span className="bg-gradient-to-tr from-cyan to-ink font-bold bg-clip-text text-transparent font-display text-2xl">
                        JobTracker
                    </span>
                </div>

                <div className="w-full max-w-md z-10 flex flex-col items-center">
                    <h1 className="heading mb-8 bg-ink font-display font-bold text-center text-3xl sm:text-4xl bg-clip-text tracking-tight">
                        Welcome back!
                    </h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
                        {apiError && (
                            <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center">
                                {apiError}
                            </div>
                        )}
                        <div className="w-full flex flex-col gap-4">
                            <div className="flex flex-col relative w-full">
                                <span className="font-mono m-1 text-[14px]">Email/Username</span>
                                <input
                                    {...register('identifier', {
                                        required: "Email or username is required"
                                    })}
                                    type="text"
                                    placeholder="Enter your email or username"
                                    className="p-3 h-11 w-full border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] focus:outline-none focus:border-indigo/60 transition-colors"
                                />
                                <FieldError message={errors.identifier?.message} />
                            </div>

                            <div className="w-full">
                                <PasswordField
                                    label="Password"
                                    placeholder="Enter your password"
                                    name="password"
                                    register={register}
                                    error={errors.password}
                                    width="w-full"
                                    rules={{
                                        required: "Password is required"
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-8 w-full flex flex-col items-center gap-4">
                            <div className="flex items-center justify-between gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => { reset() }}
                                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] text-black cursor-pointer transition-all hover:opacity-90 shadow-md"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] text-white cursor-pointer transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] shadow-md"
                                >
                                    Log in
                                </button>
                            </div>

                            <div className="w-full flex items-center my-1">
                                <div className="flex-1 h-px bg-indigo/15" />
                                <span className="px-3 text-xs text-muted font-mono uppercase">or</span>
                                <div className="flex-1 h-px bg-indigo/15" />
                            </div>

                            <Link to="/" className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] text-black transition-all hover:opacity-90 shadow-md">
                                <img src={googleIcon} alt="" className="mr-2 h-4 w-4" /> Continue with Google
                            </Link>

                            <Link to="/" className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] text-black transition-all hover:opacity-90 shadow-md">
                                <img src={codeSarthi} alt="" className="mr-2 h-4 w-4 brightness-0" /> Continue with CodeSarthi
                            </Link>

                            <Link to="/signup" className="mt-2 text-sm text-indigo-light hover:font-bold hover:underline font-mono">
                                Create new account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login