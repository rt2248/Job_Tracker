import React, { useState, useRef, useEffect } from "react";
import { useJobLocations } from "../../hooks/useJobLocations";
import Input from "../shared/Input";

function LocationCombobox({ value, onChange }) {
    const { locations } = useJobLocations();
    const [inputValue, setInputValue] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

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
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === "") onChange("");
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Location..."
                className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
                rightIcon={
                    value ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-muted hover:text-ink text-sm p-1 leading-none"
                            aria-label="Clear location"
                        >
                            ×
                        </button>
                    ) : null
                }
            />

            {isOpen && filteredLocations.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-surface-elevated border border-border-primary rounded-xl max-h-48 overflow-y-auto shadow-elevated custom-scrollbar p-1">
                    {filteredLocations.map((loc) => (
                        <button
                            key={loc}
                            type="button"
                            onClick={() => handleSelect(loc)}
                            className="w-full text-left px-3 py-1.5 text-xs sm:text-sm text-ink hover:bg-surface-overlay rounded-lg font-sans transition-colors hover:cursor-pointer"
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