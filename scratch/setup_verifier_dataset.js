/**
 * @file setup_verifier_dataset.js
 * @description Seeds the exact synthetic candidate dataset for Stage 2B.7 Controlled Live Verification.
 */

require('../Backend/node_modules/dotenv').config({ path: 'Backend/.env' });
const pool = require('../Backend/src/configs/db');
const profileModel = require('../Backend/src/models/files/profile.model');
const insightsModel = require('../Backend/src/models/files/insights.model');

async function setupSyntheticData() {
  const userId = 'dbe03098-975f-4ce3-b07c-6f61c3de791d'; // verifier_test

  // 1. Update Profile
  await pool.query(
    `INSERT INTO user_profiles (user_id, headline, bio, skills, experience, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET headline = EXCLUDED.headline,
         bio = EXCLUDED.bio,
         skills = EXCLUDED.skills,
         experience = EXCLUDED.experience,
         updated_at = NOW()`,
    [
      userId,
      'Junior Backend Developer',
      'Interested in improving backend engineering skills and securing a suitable backend development position.',
      JSON.stringify(['JavaScript', 'Node.js', 'Express.js', 'PostgreSQL', 'REST APIs', 'Git']),
      JSON.stringify([
        {
          title: 'Junior Backend Developer',
          company: 'TechCorp',
          current: true,
          startDate: '2024-11',
          endDate: null,
          description: 'Developing Node.js and Express REST APIs with PostgreSQL.'
        }
      ])
    ]
  );

  // 2. Clear existing jobs & history for verifier_test
  await pool.query('DELETE FROM job_status_history WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM jobs WHERE user_id = $1', [userId]);

  // Helper to insert job and status history
  async function insertJobWithHistory({ company, role, status, appliedDate, daysAgoStage, daysAgoCreated }) {
    const jobRes = await pool.query(
      `INSERT INTO jobs (user_id, company, role, status, applied_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - ($6 * INTERVAL '1 day'), NOW() - ($7 * INTERVAL '1 day'))
       RETURNING id`,
      [userId, company, role, status, appliedDate, daysAgoCreated, daysAgoStage]
    );
    const jobId = jobRes.rows[0].id;

    await pool.query(
      `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
       VALUES ($1, $2, NULL, $3, NOW() - ($4 * INTERVAL '1 day'))`,
      [jobId, userId, status, daysAgoStage]
    );
    return jobId;
  }

  // 4 Saved
  await insertJobWithHistory({ company: 'CloudStart', role: 'Junior Backend Engineer', status: 'saved', appliedDate: null, daysAgoStage: 25, daysAgoCreated: 25 });
  await insertJobWithHistory({ company: 'DataCore', role: 'Backend Developer', status: 'saved', appliedDate: null, daysAgoStage: 20, daysAgoCreated: 20 });
  await insertJobWithHistory({ company: 'AppFlow', role: 'API Developer', status: 'saved', appliedDate: null, daysAgoStage: 15, daysAgoCreated: 15 });
  await insertJobWithHistory({ company: 'ByteScale', role: 'Junior Node.js Developer', status: 'saved', appliedDate: null, daysAgoStage: 10, daysAgoCreated: 10 });

  // 2 Applied (1 stale > 14 days, 1 recent)
  await insertJobWithHistory({ company: 'ApexTech', role: 'Node.js Developer', status: 'applied', appliedDate: '2026-10-20', daysAgoStage: 20, daysAgoCreated: 20 });
  await insertJobWithHistory({ company: 'NovaSystems', role: 'Backend Developer', status: 'applied', appliedDate: '2026-11-04', daysAgoStage: 5, daysAgoCreated: 5 });

  // 1 OA
  await insertJobWithHistory({ company: 'Streamline', role: 'Junior Backend Engineer', status: 'oa', appliedDate: '2026-11-02', daysAgoStage: 3, daysAgoCreated: 7 });

  // 2 Interview
  await insertJobWithHistory({ company: 'FinPulse', role: 'Backend Developer', status: 'interview', appliedDate: '2026-10-30', daysAgoStage: 2, daysAgoCreated: 10 });
  await insertJobWithHistory({ company: 'SyncWave', role: 'Node.js Engineer', status: 'interview', appliedDate: '2026-10-28', daysAgoStage: 3, daysAgoCreated: 12 });

  // 3 Rejected
  await insertJobWithHistory({ company: 'OmniCloud', role: 'Junior Backend Engineer', status: 'rejected', appliedDate: '2026-10-10', daysAgoStage: 20, daysAgoCreated: 30 });
  await insertJobWithHistory({ company: 'PixelForge', role: 'Backend Developer', status: 'rejected', appliedDate: '2026-10-05', daysAgoStage: 25, daysAgoCreated: 35 });
  await insertJobWithHistory({ company: 'VortexIO', role: 'API Engineer', status: 'rejected', appliedDate: '2026-10-01', daysAgoStage: 28, daysAgoCreated: 40 });

  // 3. Verify metrics
  const prof = await profileModel.getProfileByUserId(userId);
  const sum = await insightsModel.getInsightsSummary(userId, { range: 'all' });
  const snap = await insightsModel.getPipelineSnapshot(userId);

  console.log('=== VERIFICATION OF SYNTHETIC DATASET ===');
  console.log('Candidate Headline:', prof.headline);
  console.log('Candidate Skills:', prof.skills);
  console.log('Tracked Opportunities:', sum.volumeMetrics.trackedOpportunities, '(Expected: 12)');
  console.log('Submitted Applications:', sum.volumeMetrics.submittedApplications, '(Expected: 8)');
  console.log('Saved Count:', snap.activeSegment?.stages.find(s => s.status === 'saved')?.count, '(Expected: 4)');
  console.log('Active in Pipeline:', sum.snapshotMetrics.activeInPipeline, '(Expected: 5)');
  console.log('Interviews in Progress:', sum.snapshotMetrics.interviewsInProgress, '(Expected: 2)');
  console.log('Pending Offers:', sum.snapshotMetrics.pendingOffers, '(Expected: 0)');
  console.log('Cumulative Offers:', sum.volumeMetrics.cumulativeOffers, '(Expected: 0)');
  console.log('Cumulative Rejections:', sum.volumeMetrics.cumulativeRejections, '(Expected: 3)');
  console.log('Stale Alerts:', sum.staleAlerts?.staleCount, '(Expected: 1)');

  pool.end();
}

setupSyntheticData().catch(err => {
  console.error('Setup failed:', err);
  pool.end();
  process.exit(1);
});
