import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom';

import StarField from '../components/signup_page/StarField';
import WelcomeLine from '../components/signup_page/WelcomeLine';
import FieldError from '../components/signup_page/FieldError';
import PasswordField from '../components/signup_page/PasswordField';
import googleIcon from '../assets/logos/google.svg';
import codeSarthi from '../assets/logos/codesarthi.svg';
import arrowBack from '../assets/icons/arrowback.svg';

const Login = () => {
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
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                console.error(result.message);
                return;
            }
            console.log("Login successful: ", result);
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
                    <div className="heading mb-6 bg-ink font-display font-bold text-center text-4xl bg-clip-text tracking-tight">Welcome back!</div>

                    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col items-center justify-center'>


                        <div className="email flex flex-col">
                            <div className='email my-4 relative flex gap-16'>
                                <div className="relative flex flex-col">
                                    <span className="flex flex-col font-mono m-1 text-[14px]">Email/Username</span>
                                    <input {...register('identifier', {
                                        required: "Email or username is required"
                                    })} type="text" placeholder='Enter you email or username' className='p-2 h-[5vh] w-[25vw] border border-indigo/30 rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px]' />
                                    <FieldError message={errors.identifier?.message} />
                                </div>

                            </div>
                            <div className="pass flex gap-16">
                                <PasswordField
                                    label="Password"
                                    placeholder="Enter your password"
                                    name="password"
                                    register={register}
                                    error={errors.password}
                                    width="w-[25vw]"
                                    rules={{
                                        required: "Password is required"
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-12 buttons flex flex-col items-center justify-center gap-4">
                            <div className="primary flex items-center justify-center gap-[75px]">
                                <button type='button' onClick={() => { reset() }} className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">Clear
                                </button>

                                <button className="w-[150px] text-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] border-none text-white cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">Log in
                                </button>
                            </div>

                            <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                                <img src={googleIcon} alt="" className='mr-1 h-5 w-5' />Continue with Google
                            </Link>

                            <Link to="/" className="w-[25vw] flex items-center justify-center m-1 px-[18px] py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-[#dbe1ff] to-[#9c9c9f] border-none text-black cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(225,225,249,0.3)] hover:shadow-[0_0_30px_rgba(225,225,249,0.4)]">
                                <img src={codeSarthi} alt="" className='mr-1 h-5 w-5 brightness-0' />Continue with CodeSarthi
                            </Link>

                            <Link to="/signup" className=' text-indigo-light hover:font-bold hover:underline'>Create new account</Link>
                        </div>
                    </form>
                </div>

            </div >
        </div>
    )
}

export default Login