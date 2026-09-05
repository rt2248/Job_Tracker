const pool = require("../configs/db");

const dummyJobs = [
    { company: "Google", role: "Software Engineer Intern", status: "applied", appliedDate: "2026-08-20", deadline: "2026-09-15", resumeUsed: "Resume_SWE_v3.pdf", notes: "Referred by a senior from campus placement cell.", link: "https://careers.google.com/jobs/results/12345", jobType: "internship", workMode: "hybrid", compensationMin: 100000, compensationMax: 130000, compensationPeriod: "monthly" },
    { company: "Atlassian", role: "Frontend Developer", status: "applied", appliedDate: "2026-08-22", deadline: "2026-09-10", resumeUsed: "Resume_Frontend_v2.pdf", notes: "Tailored resume to highlight React + design systems work.", link: "https://www.atlassian.com/company/careers/details/98213", jobType: "fulltime", workMode: "remote", compensationMin: 1800000, compensationMax: 2400000, compensationPeriod: "yearly" },
    { company: "Razorpay", role: "Backend Engineer - Node.js", status: "applied", appliedDate: "2026-08-25", deadline: "2026-09-20", resumeUsed: "Resume_Backend_v1.pdf", notes: "Applied through LinkedIn Easy Apply.", link: "https://razorpay.com/jobs/backend-engineer", jobType: "fulltime", workMode: "hybrid", compensationMin: 1200000, compensationMax: 1600000, compensationPeriod: "yearly" },

    { company: "Amazon", role: "SDE Intern", status: "oa", appliedDate: "2026-08-05", deadline: "2026-09-02", resumeUsed: "Resume_SWE_v3.pdf", notes: "OA has 2 DSA questions + 1 debugging round. Scheduled for next week.", link: "https://www.amazon.jobs/en/jobs/778823", jobType: "internship", workMode: "onsite", compensationMin: 80000, compensationMax: 100000, compensationPeriod: "monthly" },
    { company: "Flipkart", role: "SDE-1", status: "oa", appliedDate: "2026-08-10", deadline: "2026-09-05", resumeUsed: "Resume_Backend_v1.pdf", notes: "OA link received via email, valid for 72 hours.", link: "https://www.flipkartcareers.com/jobs/44521", jobType: "fulltime", workMode: "hybrid", compensationMin: 1800000, compensationMax: 2200000, compensationPeriod: "yearly" },
    { company: "Zoho", role: "Member of Technical Staff", status: "oa", appliedDate: "2026-08-12", deadline: "2026-08-30", resumeUsed: "Resume_Fullstack_v2.pdf", notes: "Written test focuses on aptitude + coding, no CS fundamentals round.", link: "https://careers.zoho.com/jobs/mts-2026", jobType: "fulltime", workMode: "onsite", compensationMin: 900000, compensationMax: 1200000, compensationPeriod: "yearly" },

    { company: "Microsoft", role: "Software Engineer Intern", status: "interview", appliedDate: "2026-07-15", deadline: "2026-09-01", resumeUsed: "Resume_SWE_v3.pdf", notes: "Cleared OA + 1 technical round. Final round scheduled for next Friday.", link: "https://careers.microsoft.com/students/us/en/job/167234", jobType: "internship", workMode: "onsite", compensationMin: 100000, compensationMax: 120000, compensationPeriod: "monthly" },
    { company: "PhonePe", role: "SDE Intern", status: "interview", appliedDate: "2026-07-20", deadline: "2026-08-28", resumeUsed: "Resume_Fullstack_v2.pdf", notes: "Round 1 went well, focused mostly on system design basics.", link: "https://www.phonepe.com/careers/job/sde-intern-2026", jobType: "internship", workMode: "hybrid", compensationMin: 60000, compensationMax: 80000, compensationPeriod: "monthly" },
    { company: "Freshworks", role: "Associate Software Engineer", status: "interview", appliedDate: "2026-07-25", deadline: "2026-09-03", resumeUsed: "Resume_Backend_v1.pdf", notes: "HR round done, waiting on technical panel scheduling.", link: "https://www.freshworks.com/company/careers/", jobType: "fulltime", workMode: "hybrid", compensationMin: 1000000, compensationMax: 1300000, compensationPeriod: "yearly" },

    { company: "Postman", role: "Software Development Intern", status: "offer", appliedDate: "2026-06-10", deadline: "2026-08-25", resumeUsed: "Resume_Fullstack_v2.pdf", notes: "Offer letter received! Stipend + PPO details in email. Need to respond by deadline.", link: "https://www.postman.com/careers/", jobType: "internship", workMode: "remote", compensationMin: 70000, compensationMax: 90000, compensationPeriod: "monthly" },
    { company: "CRED", role: "Backend Engineer", status: "offer", appliedDate: "2026-06-20", deadline: "2026-08-30", resumeUsed: "Resume_Backend_v1.pdf", notes: "Verbal offer confirmed, formal letter expected this week.", link: "https://careers.cred.club/", jobType: "fulltime", workMode: "onsite", compensationMin: 2000000, compensationMax: 2600000, compensationPeriod: "yearly" },
    { company: "Swiggy", role: "SDE-1", status: "offer", appliedDate: "2026-06-25", deadline: "2026-09-05", resumeUsed: "Resume_Backend_v1.pdf", notes: "Comparing this against CRED offer before deciding.", link: "https://careers.swiggy.com/", jobType: "fulltime", workMode: "hybrid", compensationMin: 1600000, compensationMax: 2000000, compensationPeriod: "yearly" },

    { company: "Adobe", role: "Software Engineer Intern", status: "accepted", appliedDate: "2026-05-15", deadline: "2026-07-01", resumeUsed: "Resume_SWE_v3.pdf", notes: "Accepted the offer. Onboarding docs submitted, joining in Jan.", link: "https://careers.adobe.com/", jobType: "internship", workMode: "onsite", compensationMin: 100000, compensationMax: 120000, compensationPeriod: "monthly" },
    { company: "Innovaccer", role: "Full Stack Developer", status: "accepted", appliedDate: "2026-05-20", deadline: "2026-07-10", resumeUsed: "Resume_Fullstack_v2.pdf", notes: "Signed offer letter, background verification in progress.", link: "https://innovaccer.com/careers", jobType: "fulltime", workMode: "remote", compensationMin: 1400000, compensationMax: 1800000, compensationPeriod: "yearly" },

    { company: "Meta", role: "Software Engineer Intern", status: "rejected", appliedDate: "2026-04-10", deadline: "2026-05-01", resumeUsed: "Resume_SWE_v3.pdf", notes: "Rejected after final round. Feedback: need stronger system design fundamentals.", link: "https://www.metacareers.com/jobs/", jobType: "internship", workMode: "onsite", compensationMin: 150000, compensationMax: 180000, compensationPeriod: "monthly" },
    { company: "Uber", role: "SDE Intern", status: "rejected", appliedDate: "2026-04-15", deadline: "2026-05-10", resumeUsed: "Resume_Backend_v1.pdf", notes: "Rejected at OA stage, didn't clear the cutoff.", link: "https://www.uber.com/careers/", jobType: "internship", workMode: "hybrid", compensationMin: 90000, compensationMax: 110000, compensationPeriod: "monthly" },
    { company: "Paytm", role: "Backend Developer", status: "rejected", appliedDate: "2026-04-20", deadline: "2026-05-15", resumeUsed: "Resume_Backend_v1.pdf", notes: "No response for 3 weeks, followed up once, then got rejection email.", link: "https://jobs.paytm.com/", jobType: "fulltime", workMode: "hybrid", compensationMin: 1200000, compensationMax: 1500000, compensationPeriod: "yearly" },
    { company: "Groww", role: "Frontend Engineer", status: "rejected", appliedDate: "2026-04-25", deadline: "2026-05-20", resumeUsed: "Resume_Frontend_v2.pdf", notes: "Made it to final round, lost out to a candidate with more prod experience.", link: "https://groww.in/careers", jobType: "fulltime", workMode: "remote", compensationMin: 1500000, compensationMax: 1900000, compensationPeriod: "yearly" },
];

async function seedJobs(identifier) {
    if (!identifier) {
        console.error("Usage: node src/scripts/seedJobs.js <email_or_username>");
        process.exit(1);
    }

    try {
        const userResult = await pool.query(
            "SELECT id FROM users WHERE email = $1 OR user_name = $1",
            [identifier]
        );

        if (userResult.rows.length === 0) {
            console.error(`No user found with email/username: ${identifier}`);
            process.exit(1);
        }

        const userId = userResult.rows[0].id;

        const deleteResult = await pool.query("DELETE FROM jobs WHERE user_id = $1", [userId]);
        console.log(`Removed ${deleteResult.rowCount} existing job(s) for this user.`);

        console.log(`Seeding ${dummyJobs.length} jobs...`);

        for (const job of dummyJobs) {
            await pool.query(
                `INSERT INTO jobs (user_id, company, role, status, applied_date, deadline, resume_used, notes, link, job_type, work_mode, compensation_min, compensation_max, compensation_period)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [userId, job.company, job.role, job.status, job.appliedDate, job.deadline, job.resumeUsed, job.notes, job.link, job.jobType, job.workMode, job.compensationMin, job.compensationMax, job.compensationPeriod]
            );
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await pool.end();
    }
}

const identifier = process.argv[2];
seedJobs(identifier);