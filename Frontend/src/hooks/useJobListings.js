import { useState, useEffect, useRef } from "react";
import { getListings } from "../services/jobSearchService";

const DEBOUNCE_DELAY = 400;

const initialFilters = {
    search: "",
    type: "",
    workMode: "",
    experienceLevel: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    postedWithin: "",
    tags: [],
};

export function useJobListings() {
    const [filters, setFilters] = useState(initialFilters);
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const debounceTimer = useRef(null);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters(initialFilters);
    };

    // Debounce only the search text — every other filter updates immediately.
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceTimer.current);
    }, [filters.search]);

    // Actual fetch — depends on debouncedSearch, not filters.search directly.
    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const activeFilters = { ...filters, search: debouncedSearch };
                const data = await getListings(activeFilters);
                setListings(data);
            } catch (err) {
                console.error("Error fetching listings: ", err);
                setError(err.message || "Something went wrong while fetching listings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedSearch,
        filters.type,
        filters.workMode,
        filters.experienceLevel,
        filters.location,
        filters.salaryMin,
        filters.salaryMax,
        filters.postedWithin,
        filters.tags,
    ]);

    return { filters, updateFilter, clearFilters, listings, isLoading, error };
}