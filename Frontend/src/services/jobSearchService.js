const BASE_URL = "http://localhost:5000/api/listings";

const buildQueryString = (filters) => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.workMode) params.set("workMode", filters.workMode);
    if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);
    if (filters.location) params.set("location", filters.location);
    if (filters.salaryMin) params.set("salaryMin", filters.salaryMin);
    if (filters.salaryMax) params.set("salaryMax", filters.salaryMax);
    if (filters.postedWithin) params.set("postedWithin", filters.postedWithin);
    if (filters.tags && filters.tags.length > 0) params.set("tags", filters.tags.join(","));

    return params.toString();
};

export const getListings = async (filters = {}) => {
    const token = localStorage.getItem("token");
    const queryString = buildQueryString(filters);
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to fetch listings");
    }

    return result.listings;
};

export const getTags = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/tags`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to fetch tags");
    }

    return result.tags;
};

export const getLocations = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/locations`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to fetch locations");
    }

    return result.locations;
};