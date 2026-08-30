const { getJobsByUserId } = require("../models/files/jobs.model");

const getJobs = async (req, res) => {
    try {
        const userId = req.user.userId;

        const jobs = await getJobsByUserId(userId);

        const formattedJobs = jobs.map((job) => ({
            id: job.id,
            company: job.company,
            role: job.role,
            status: job.status,
            appliedDate: job.applied_date,
            deadline: job.deadline,
            resumeUsed: job.resume_used,
            notes: job.notes,
            link: job.link,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
        }));

        res.status(200).json({
            message: "Jobs fetched successfully",
            jobs: formattedJobs,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getJobs };