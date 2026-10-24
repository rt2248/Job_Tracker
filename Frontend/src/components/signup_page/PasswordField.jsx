import { useState } from 'react';
import visibilityIcon from '../../assets/icons/visibility.svg';
import visibilityOffIcon from '../../assets/icons/visibilityoff.svg';
import FieldError from './FieldError';

const PasswordField = ({ label, placeholder, name, register, rules, error, width = 'w-full' }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`relative flex flex-col ${width}`}>
            <span className='font-mono m-1 text-[14px]'>{label}</span>
            <div className='relative w-full'>
                <input
                    {...register(name, rules)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    className={`p-3 h-11 w-full pr-10 border rounded-xl bg-[#121316] placeholder:text-muted/50 text-ink font-mono text-[14px] focus:outline-none focus:border-ink/70 focus:ring-1 focus:ring-ink/40 transition-colors ${error ? 'border-red-500' : 'border-white/10'}`}
                />
                <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1'
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