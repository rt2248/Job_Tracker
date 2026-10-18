import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../utils/config";

export function useJobs() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const response = await fetch(getApiUrl("/api/jobs"), {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.message);
                return;
            }

            setJobs(result.jobs || []);
            setError(null);
        }
        catch (error) {
            console.error("Network error: ", error);
            setError("Something went wrong while fetching jobs");
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    return { jobs, isLoading, error, refetch: fetchJobs, setJobs };
}