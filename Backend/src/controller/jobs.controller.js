const {
    getJobsByUserId,
    getTrackedListingMap,
    createJobFromListing,
    updateJobStatus,
} = require("../models/files/jobs.model");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// snake_case -> camelCase happens here, in the controller layer.
const formatJob = (job) => ({
    id: job.id,
    company: job.company,
    role: job.role,
    status: job.status,
    appliedDate: job.applied_date,
    deadline: job.deadline,
    resumeUsed: job.resume_used,
    notes: job.notes,
    link: job.link,
    jobType: job.job_type,
    workMode: job.work_mode,
    compensationMin: job.compensation_min,
    compensationMax: job.compensation_max,
    compensationPeriod: job.compensation_period,
    compensationCurrency: job.compensation_currency,
    sourceListingId: job.source_listing_id,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
});

const getJobs = async (req, res) => {
    try {
        const userId = req.user.userId;
        const jobs = await getJobsByUserId(userId);

        res.status(200).json({
            message: "Jobs fetched successfully",
            jobs: jobs.map(formatJob),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

// { tracked: { "<listingId>": "<jobId>", ... } }
const getTrackedListings = async (req, res) => {
    try {
        const rows = await getTrackedListingMap(req.user.userId);

        const tracked = {};
        for (const row of rows) {
            tracked[row.listing_id] = row.job_id;
        }

        res.status(200).json({ tracked });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const addJobFromListing = async (req, res) => {
    try {
        const { listingId } = req.body;

        if (!listingId || !UUID_REGEX.test(listingId)) {
            return res.status(400).json({ message: "A valid listingId is required" });
        }

        const result = await createJobFromListing(req.user.userId, listingId);

        if (result.notFound) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (!result.created) {
            return res.status(409).json({
                message: "This job is already in your tracker",
                job: formatJob(result.job),
            });
        }

        res.status(201).json({
            message: "Job added to tracker",
            job: formatJob(result.job),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const VALID_STATUSES = ["saved", "applied", "oa", "interview", "offer", "accepted", "rejected"];

const changeJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !UUID_REGEX.test(id)) {
            return res.status(400).json({ message: "A valid jobId is required" });
        }
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
        }

        const updatedJob = await updateJobStatus(req.user.userId, id, status);
        if (!updatedJob) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json({
            message: "Status updated successfully",
            job: formatJob(updatedJob),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getJobs, getTrackedListings, addJobFromListing, changeJobStatus };