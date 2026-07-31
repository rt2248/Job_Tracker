import { useForm } from 'react-hook-form'
import NavBar from '../components/landing_page/NavBar';

const SignUp = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const onSubmit = (data) => console.log(data)

    return (
        <div className="main">
            <NavBar/>
            <div className="form">
                <form action="" onSubmit={handleSubmit(onSubmit)}>
                    <input {...register('name')} type="text" name="name" placeholder='Enter your name' />
                    <br />
                    <input {...register('email')} type="text" name="email" placeholder='Enter your email' />
                    <br />
                    <input {...register('password')} type="password" name="password" placeholder='Enter your username' />
                </form>
            </div>
        </div>
    )
}

export default SignUp