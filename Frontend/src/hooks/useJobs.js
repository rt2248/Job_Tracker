import { useState, useEffect } from "react";

export function useJobs() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/jobs", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const result = await response.json();

                if (!response.ok) {
                    setError(result.message);
                    return;
                }

                setJobs(result.jobs);
            }
            catch (error) {
                console.error("Network error: ", error);
                setError("Something went wrong while fetching jobs");
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return { jobs, isLoading, error };
}