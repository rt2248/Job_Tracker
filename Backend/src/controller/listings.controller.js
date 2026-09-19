const { getListings, getDistinctLocations, getDistinctTags } = require("../models/files/listings.model");

const getJobListings = async (req, res) => {
    try {
        const { search, type, workMode, experienceLevel, location, salaryMin, salaryMax, postedWithin, tags } = req.query;

        const filters = {
            search,
            type,
            workMode,
            experienceLevel,
            location,
            salaryMin: salaryMin ? Number(salaryMin) : undefined,
            salaryMax: salaryMax ? Number(salaryMax) : undefined,
            postedWithin,
            tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        };

        const listings = await getListings(filters);

        const formattedListings = listings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            company: listing.company,
            location: listing.location,
            jobType: listing.job_type,
            workMode: listing.work_mode,
            experienceLevel: listing.experience_level,
            compensationMin: listing.compensation_min,
            compensationMax: listing.compensation_max,
            compensationPeriod: listing.compensation_period,
            compensationCurrency: listing.compensation_currency,
            postedDate: listing.posted_date,
            description: listing.description,
            requirements: listing.requirements,
            link: listing.link,
            createdAt: listing.created_at,
            tags: listing.tags,
        }));

        res.status(200).json({
            message: "Listings fetched successfully",
            listings: formattedListings,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getLocations = async (req, res) => {
    try {
        const locations = await getDistinctLocations();
        res.status(200).json({ locations });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getTags = async (req, res) => {
    try {
        const tags = await getDistinctTags();
        res.status(200).json({ tags });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getJobListings, getLocations, getTags };