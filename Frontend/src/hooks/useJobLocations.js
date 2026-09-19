import { useState, useEffect } from "react";
import { getLocations } from "../services/jobSearchService";

export function useJobLocations() {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await getLocations();
                setLocations(data);
            } catch (err) {
                console.error("Error fetching locations: ", err);
                setError(err.message || "Something went wrong while fetching locations");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return { locations, isLoading, error };
}