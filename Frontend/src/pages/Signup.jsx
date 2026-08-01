import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom';

import NavBar from '../components/landing_page/NavBar';
import Footer from '../components/landing_page/Footer';
import WelcomeLine from '../components/signup_page/welcomeline';
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
                    <div className="text mt-6 ml-12 flex flex-col gap-4">
                        <span className='bg-gradient-to-tr font-bold from-cyan to-ink text bg-clip-text text-transparent tracking-tight font-display text-8xl'>JobTracker</span>
                        <span className='m-2 text-ink font-display font-bold text-center text-6xl tracking-tight'><WelcomeLine /></span>
                    </div>
                    <div className="box flex items-center justify-center mt-10 h-[47vh] w-[35vw] bg-surface opacity-50 border-2 border-indigo rounded-full">
                        Tabahi Animation Coming Soon...
                    </div>
                </div>


                <div className='h-[90vh] w-[50vw] bg-canvas border-4 border-ink rounded-[50px]'>
                    <div className="heading m-2 bg-ink font-display font-bold text-center text-5xl bg-clip-text tracking-tight">Create new account.</div>

                    <div className='flex gap-5'>
                        <div className="ml-10 mt-10 flex flex-col">
                            <span className="name font-mono m-1">First name</span>
                            <input type="text" placeholder='Monkey' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                        </div>
                        <div className="m-10 flex flex-col">
                            <span className="name font-mono m-1">Middle name</span>
                            <input type="text" placeholder='D.' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                        </div>
                        <div className="mr-10 mt-10 flex flex-col">
                            <span className="name font-mono m-1">Last name</span>
                            <input type="text" placeholder='Luffy' className='p-2 h-[5vh] w-[12vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                        </div>
                    </div>

                    <div className="email ml-10 flex flex-col">
                        <div className='email mb-10'>
                            <span className="flex flex-col font-mono m-1">Email</span>
                            <input type="text" placeholder='example123@xyz.com' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                        </div>
                        <div className="pass flex gap-16">
                            <div>
                                <span className="flex flex-col font-mono m-1">Password</span>
                                <input type="password" placeholder='Enter password' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                            </div>
                            <div>
                                <span className="flex flex-col font-mono m-1">Confirm password</span>
                                <input type="password" placeholder='Confirm password' className='p-2 h-[5vh] w-[20vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono' />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 buttons flex flex-col items-center justify-center gap-4">
                        <div className="primary flex items-center justify-center gap-20">
                            <Link to="/" className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">Back
                            </Link>

                            <Link to="/signup/details" className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] border-none text-white cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">Submit
                            </Link>
                        </div>

                        <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                            <img src={googleIcon} alt="" className='mr-1 h-5 w-5' />Continue with Google
                        </Link>

                        <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                            <img src={codeSarthi} alt="" className='mr-1 h-5 w-5 brightness-0' />Continue with CodeSarthi
                        </Link>

                        <Link to="/login" className=' text-indigo-light hover:font-bold hover:underline'>Already a user?</Link>
                    </div>

                </div>
            </div>
            <Footer />
        </>
    )
}

export default SignUp