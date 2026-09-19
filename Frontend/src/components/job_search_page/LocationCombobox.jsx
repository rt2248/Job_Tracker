import { useState, useRef, useEffect } from "react";
import { useJobLocations } from "../../hooks/useJobLocations";

function LocationCombobox({ value, onChange }) {
    const { locations } = useJobLocations();
    const [inputValue, setInputValue] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredLocations = locations.filter((loc) =>
        loc.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleSelect = (location) => {
        setInputValue(location);
        onChange(location);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInputValue("");
        onChange("");
    };

    return (
        <div ref={containerRef} className="relative w-full sm:w-48">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === "") onChange("");
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Location"
                className="w-full bg-surface border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted font-mono focus:outline-none focus:border-indigo/50"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-sm"
                    aria-label="Clear location"
                >
                    ×
                </button>
            )}
            {isOpen && filteredLocations.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-surface border border-surface-2 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                    {filteredLocations.map((loc) => (
                        <button
                            key={loc}
                            onClick={() => handleSelect(loc)}
                            className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-indigo/15 font-mono"
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LocationCombobox;