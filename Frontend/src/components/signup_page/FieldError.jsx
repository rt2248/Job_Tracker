const FieldError = ({ message }) => {
    if (!message) return null;
    return (
        <div className="absolute top-full left-1 z-10 mt-1 flex items-center gap-2 bg-white text-black text-xs font-mono px-3 py-2 rounded-lg shadow-lg">
            <span className="flex items-center justify-center h-4 w-4 rounded-sm bg-orange-500 text-white text-[10px] font-bold">!</span>
            {message}
        </div>
    );
};

export default FieldError;