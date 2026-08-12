import WarningIcon from './WarningIcon';

const FieldError = ({ message }) => {
    if (!message) return null;
    return (
        <div className="mt-1 absolute top-full whitespace-nowrap flex items-center gap-1 text-red text-[11px] font-mono">
            <WarningIcon className="h-3 w-3 shrink-0" />
            {message}
        </div>
    );
};

export default FieldError;