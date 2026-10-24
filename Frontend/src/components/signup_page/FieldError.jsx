import WarningIcon from './WarningIcon';

const FieldError = ({ message }) => {
    if (!message) return null;
    return (
        <div className="mt-1.5 flex items-start gap-1 text-red text-[11px] font-mono leading-tight">
            <WarningIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="flex-1 break-words">{message}</span>
        </div>
    );
};

export default FieldError;