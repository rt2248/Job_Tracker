import { useState, useEffect } from "react";
import { getTags } from "../services/jobSearchService";

export function useJobTags() {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await getTags();
                setTags(data);
            } catch (err) {
                console.error("Error fetching tags: ", err);
                setError(err.message || "Something went wrong while fetching tags");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTags();
    }, []);

    return { tags, isLoading, error };
}