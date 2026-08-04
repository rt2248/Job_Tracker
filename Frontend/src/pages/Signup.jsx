import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom';

import NavBar from '../components/landing_page/NavBar';
import Footer from '../components/landing_page/Footer';
import WelcomeLine from '../components/signup_page/welcomeline';
import FieldError from '../components/signup_page/FieldError'
import googleIcon from '../assets/icons/google.svg';
import codeSarthi from '../assets/icons/codesarthi.svg';

const SignUp = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const onSubmit = (data) => console.log(data)

    return (
        <>
            <div className="main flex items-center justify-center">
                <div className='h-[90vh] w-[50vw] bg-canvas flex flex-col justify-start items-center'>
                    <div className="logo">
                        <img className='m-4 h-24 w-24 absolute top-2 left-2' src="https://www.logoai.com/oss/icons/2021/12/02/Q9pS-i3L1EHuO4S.png" alt="Logo" />
                    </div>
                    <div className="text mt-6 ml-12 flex flex-col items-center gap-4">
                        <span className='bg-gradient-to-tr font-bold from-cyan to-ink text bg-clip-text text-transparent tracking-tight font-display text-8xl'>JobTracker</span>
                        <span className='m-2 w-[26vw] text-ink font-display font-bold text-center text-6xl tracking-tight'><WelcomeLine /></span>
                    </div>
                    <div className="box flex items-center justify-center mt-10 h-[47vh] w-[35vw] bg-surface opacity-50 border-2 border-indigo rounded-full">
                        Tabahi Animation Coming Soon...
                    </div>
                </div>

                <div className="bg-white rounded-s-2xl">
                    <div className='h-[90vh] w-[50vw] bg-canvas border-4 border-ink rounded-[80px]'>
                        <div className="heading m-2 bg-ink font-display font-bold text-center text-5xl bg-clip-text tracking-tight">Create new account.</div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='flex gap-5'>
                                <div className="ml-10 mt-10 flex flex-col relative">
                                    <span className="name font-mono m-1">First name<sup>*</sup></span>
                                    <input {...register('firstname', {
                                        required: "First name is required",
                                        pattern: {
                                            value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                            message: "Enter a valid name"
                                        }
                                    })} type="text" placeholder='Monkey' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                    <FieldError message={errors.firstname?.message} />
                                </div>
                                <div className="ml-10 mr-10 mt-10 flex flex-col">
                                    <span className="name font-mono m-1">Middle name</span>
                                    <input {...register('midname')} type="text" placeholder='D.' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                </div>
                                <div className="mr-10 mt-10 flex flex-col relative">
                                    <span className="name font-mono m-1">Last name<sup>*</sup></span>
                                    <input {...register('lastname', {
                                        required: "Last name is required",
                                        pattern: {
                                            value: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
                                            message: "Enter a valid name"
                                        }
                                    })} type="text" placeholder='Luffy' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                    <FieldError message={errors.lastname?.message} />
                                </div>
                            </div>

                            <div className="email ml-10 flex flex-col">
                                <div className='email mt-10 mb-10 relative'>
                                    <span className="flex flex-col font-mono m-1">Email<sup>*</sup></span>
                                    <input {...register('email', {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Enter a valid email"
                                        }
                                    })} type="text" placeholder='example123@xyz.com' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                    <FieldError message={errors.email?.message} />
                                </div>
                                <div className="pass flex gap-16">
                                    <div className='relative flex flex-col'>
                                        <span className=" font-mono m-1">Password<sup>*</sup></span>
                                        <input {...register('password', {
                                            required: "Password is required",
                                            minlength: {
                                                value: 8,
                                                message: "Password must have at least 8 characters"
                                            },
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                                message: 'Needs 1 uppercase, lowercase, number, symbol'
                                            }
                                        })} type="password" placeholder='Enter password' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                        <FieldError message={errors.password?.message} />
                                    </div>
                                    <div className='relative flex flex-col '>
                                        <span className="font-mono m-1">Confirm password<sup>*</sup></span>
                                        <input {...register('confirmPassword', {
                                            required: "Please confirm your password",
                                            validate: (value) => value === watch("password") || "Passwords do not match"
                                        })} type="password" placeholder='Confirm password' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                                        <FieldError message={errors.confirmPassword?.message} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 buttons flex flex-col items-center justify-center gap-4">
                                <div className="primary flex items-center justify-center gap-20">
                                    <Link to="/" className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">Back
                                    </Link>

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
                </div>
            </div >
            <Footer />
        </>
    )
}

export default SignUp