import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom';

import StarField from '../../components/signup_page/StarField';
import WelcomeLine from '../../components/signup_page/WelcomeLine';
import FieldError from '../../components/signup_page/FieldError';
import PasswordField from '../../components/signup_page/PasswordField';
import googleIcon from '../../assets/logos/google.svg';
import codeSarthi from '../../assets/logos/codesarthi.svg';
import arrowBack from '../../assets/icons/arrowback.svg';

const SignUp = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            const response = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                console.error(result.message);
                return;
            }
            console.log("Signup successful: ", result);
            localStorage.setItem('token', result.token);
            navigate('/dashboard')
        }
        catch (error) {
            console.error("Network error: ", error);
        }
    };

    return (
        <div className=''>
            <div className="main flex items-center justify-center gap-1">
                <div className='bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] min-h-screen w-[35vw] flex flex-col justify-between border-r border-r-transparent [border-image:linear-gradient(to_bottom,transparent,rgba(76,76,128,0.3),transparent)_1]'>
                    <Link to="/" className='mx-5 my-5 max-w-20 flex items-center px-2 py-1 font-display text-[18px] hover:bg-indigo/10 hover:rounded-xl transition-all ease'> <img src={arrowBack} className='h-4 w-4' /> Home</Link>
                    <div>
                        <div className="text flex flex-col gap-2">
                            <span className='mx-10 w-min bg-gradient-to-tr from-cyan to-ink font-bold bg-clip-text text-transparent tracking-tight font-display text-5xl [filter:drop-shadow(0_0_8px_rgba(34,211,238,0.4))_drop-shadow(0_0_22px_rgba(241,245,249,0.25))]'>
                                JobTracker
                            </span>
                            <span className='mx-11 w-[26vw] text-ink font-display font-bold text-3xl tracking-tight'><WelcomeLine /></span>
                        </div>
                        <div className='mx-10 my-10 text-muted-light text-[20px]'>
                            Turns job-hunt chaos into something that looks actually manageable.
                        </div>
                    </div>
                    <div className='mx-10 my-10 text-ink text-[20px]'>
                        <p className='font-semibold'>Trusted by job seekers applying to</p>
                        <p className='mx-2'>Google · Stripe · Vercel · Meta</p>
                    </div>
                </div>


                <div className='min-h-screen w-[65vw] flex flex-col items-center justify-center bg-surface/30 relative'>
                    <StarField />
                    <div className="heading mb-6 bg-ink font-display font-bold text-center text-4xl bg-clip-text tracking-tight">Create new account</div>

                    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-center justify-center'>
                        <div className='flex gap-8'>
                            <div className="flex flex-col relative">
                                <span className="name font-mono m-1 text-[14px]">First name</span>
                                <input {...register('firstname', {
                                    required: "First name is required",
                                    pattern: {
                                        value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                        message: "Enter a valid name"
                                    }
                                })} type="text" placeholder='Monkey' className={`p-2 h-[5vh] w-[10vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] ${errors.firstname ? 'border-red' : 'border-indigo/30'}`} />
                                <FieldError message={errors.firstname?.message} />
                            </div>
                            <div className="flex flex-col">
                                <span className="name font-mono m-1 text-[14px]">Middle name</span>
                                <input {...register('midname')} type="text" placeholder='D.' className='p-2 h-[5vh] w-[10vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px]' />
                            </div>
                            <div className="flex flex-col relative">
                                <span className="name font-mono m-1 text-[14px]">Last name</span>
                                <input {...register('lastname', {
                                    required: "Last name is required",
                                    pattern: {
                                        value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                        message: "Enter a valid name"
                                    }
                                })} type="text" placeholder='Luffy' className={`p-2 h-[5vh] w-[10vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] ${errors.lastname ? 'border-red' : 'border-indigo/30'}`} />
                                <FieldError message={errors.lastname?.message} />
                            </div>
                        </div>

                        <div className="email flex flex-col">
                            <div className='email my-4 relative flex gap-16'>
                                <div className="relative flex flex-col">
                                    <span className="flex flex-col font-mono m-1 text-[14px]">Email</span>
                                    <input {...register('email', {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Enter a valid email"
                                        }
                                    })} type="text" placeholder='example123@xyz.com' className={`p-2 h-[5vh] w-[15vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] ${errors.email ? 'border-red' : 'border-indigo/30'}`} />
                                    <FieldError message={errors.email?.message} />
                                </div>
                                <div className="relative flex flex-col">
                                    <span className="flex flex-col font-mono m-1 text-[14px]">Username</span>
                                    <input {...register('username', {
                                        required: "Username is required",
                                        pattern: {
                                            value: /^[a-z][a-z0-9_.\-]*$/,
                                            message: "Enter a valid username"
                                        }
                                    })} type="text" placeholder='username_123' className={`p-2 h-[5vh] w-[15vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] ${errors.username ? 'border-red' : 'border-indigo/30'}`} />
                                    <FieldError message={errors.username?.message} />
                                </div>
                            </div>
                            <div className="pass flex gap-16">
                                <PasswordField
                                    label="Password"
                                    placeholder="Enter password"
                                    name="password"
                                    register={register}
                                    error={errors.password}
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
                                    rules={{
                                        required: "Please confirm your password",
                                        validate: (value) => value === watch("password") || "Passwords do not match"
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-12 buttons flex flex-col items-center justify-center gap-4">
                            <div className="primary flex items-center justify-center gap-20">
                                <button type='button' onClick={() => { reset() }} className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">Clear
                                </button>

                                <button className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] border-none text-white cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">Submit
                                </button>
                            </div>

                            <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                                <img src={googleIcon} alt="" className='mr-1 h-5 w-5' />Continue with Google
                            </Link>

                            <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                                <img src={codeSarthi} alt="" className='mr-1 h-5 w-5 brightness-0' />Continue with CodeSarthi
                            </Link>

                            <Link to="/login" className=' text-indigo-light hover:font-bold hover:underline'>Already a user?</Link>
                        </div>
                    </form>
                </div>

            </div >
        </div>
    )
}

export default SignUp