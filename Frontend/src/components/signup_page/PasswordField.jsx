import { useState } from 'react';
import visibilityIcon from '../../assets/icons/visibility.svg';
import visibilityOffIcon from '../../assets/icons/visibilityoff.svg';
import FieldError from './FieldError';

const PasswordField = ({ label, placeholder, name, register, rules, error, width='w-[15vw]' }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className='relative flex flex-col'>
            <span className='font-mono m-1 text-[14px]'>{label}</span>
            <div className='relative'>
                <input
                    {...register(name, rules)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    className={`p-2 h-[5vh] ${width} pr-9 border rounded-xl bg-indigo/10 placeholder-ink/40 font-mono text-[14px] ${error ? 'border-red' : 'border-indigo/30'}`}
                />
                <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center'
                >
                    <img
                        src={showPassword ? visibilityOffIcon : visibilityIcon}
                        alt={showPassword ? 'Hide password' : 'Show password'}
                        className='h-4 w-4 opacity-70 hover:opacity-100 transition-opacity'
                    />
                </button>
            </div>
            <FieldError message={error?.message} />
        </div>
    );
};

export default PasswordField;