/**
 * @file execute_live_verification.js
 * @description Single live execution runner for Stage 2B.7 Controlled Live Verification.
 *
 * Dispatches strictly 1 request to POST /api/career-strategist/assessment
 * through the Vite frontend proxy at http://localhost:5173/api/career-strategist/assessment
 * using authenticated JWT credentials for the synthetic candidate (verifier_test).
 *
 * NO RETRIES. SINGLE REQUEST ONLY.
 */

require('../Backend/node_modules/dotenv').config({ path: 'Backend/.env' });
const jwt = require('../Backend/node_modules/jsonwebtoken');
const fs = require('fs');

async function runSingleLiveVerification() {
  console.log('=== STAGE 2B.7 LIVE VERIFICATION DISPATCH ===');
  console.log('Timestamp:', new Date().toISOString());

  // 1. Generate authentic session token for verifier_test
  const userId = 'dbe03098-975f-4ce3-b07c-6f61c3de791d';
  const token = jwt.sign(
    { userId, tokenVersion: 1 },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 2. Target endpoint: Frontend proxy (matching UI behavior)
  const endpoint = 'http://localhost:5173/api/career-strategist/assessment';

  // 3. Synthetic Request Payload
  const payload = {
    targetRoles: ['Backend Developer', 'Node.js Developer'],
    yearsOfExperience: 2,
    userNotes: 'Interested in improving backend engineering skills and securing a suitable backend development position.',
  };

  console.log('Endpoint:', endpoint);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Dispatching EXACTLY 1 request to live Groq endpoint through backend pipeline...');

  const startTime = Date.now();
  let response;
  let rawBodyText = '';
  let parsedJson = null;
  let httpError = null;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    rawBodyText = await response.text();
    try {
      parsedJson = JSON.parse(rawBodyText);
    } catch (e) {
      parsedJson = { unparsed: rawBodyText };
    }
  } catch (err) {
    httpError = err;
  }

  const durationMs = Date.now() - startTime;

  const executionLog = {
    timestamp: new Date().toISOString(),
    endpoint,
    durationMs,
    httpStatus: response ? response.status : null,
    httpStatusText: response ? response.statusText : null,
    headers: response ? Object.fromEntries(response.headers.entries()) : {},
    error: httpError ? httpError.message : null,
    responseBody: parsedJson,
  };

  // Write log to scratch directory for audit preservation
  fs.writeFileSync(
    'scratch/live_verification_result.json',
    JSON.stringify(executionLog, null, 2),
    'utf8'
  );

  console.log('=== EXECUTION COMPLETE ===');
  console.log('Duration:', durationMs, 'ms');
  console.log('HTTP Status:', response ? response.status : 'Network Error');
  console.log('Response JSON:', JSON.stringify(parsedJson, null, 2));

  return executionLog;
}

runSingleLiveVerification().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
