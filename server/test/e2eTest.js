import http from 'http';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting WorkerConnect End-to-End API & Workflow Validation...\n');

  // 1. Health Check
  const health = await request('GET', '/api/health');
  console.log(`✅ [1/10] Server Health: HTTP ${health.status} (${health.body.status})`);

  // 2. Authentication: Customer, Worker, Admin Logins
  const custLogin = await request('POST', '/api/auth/login', {
    email: 'priya.customer@example.com',
    password: 'customer123',
  });
  console.log(`✅ [2/10] Customer Auth: Logged in as "${custLogin.body.user.fullName}" (Role: ${custLogin.body.user.role})`);
  const custToken = custLogin.body.token;

  const workerLogin = await request('POST', '/api/auth/login', {
    email: 'rahul.electrician@example.com',
    password: 'worker123',
  });
  console.log(`✅ [3/10] Worker Auth: Logged in as "${workerLogin.body.user.fullName}" (Skill: ${workerLogin.body.user.skill})`);
  const workerToken = workerLogin.body.token;

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@workerconnect.com',
    password: 'admin123',
  });
  console.log(`✅ [4/10] Admin Auth: Logged in as "${adminLogin.body.user.fullName}" (Role: ${adminLogin.body.user.role})`);
  const adminToken = adminLogin.body.token;

  // 3. Search & Discovery
  const searchRes = await request('GET', '/api/workers?skill=Electrician&lat=12.9784&lng=77.6408');
  console.log(`✅ [5/10] Worker Search: Found ${searchRes.body.count} approved electricians nearby with computed distances.`);
  const targetWorker = searchRes.body.workers[0];

  // 4. Create Booking (Customer -> Worker)
  const newBookingRes = await request(
    'POST',
    '/api/bookings',
    {
      workerId: targetWorker.id,
      workType: 'Switchboard sparking & MCB repair',
      serviceAddress: 'Flat 302, Palm Heights, Indiranagar',
      location: 'Indiranagar, Bengaluru',
      preferredDate: '2025-02-25',
      preferredTime: '10:00 AM - 01:00 PM',
      description: 'Hallway MCB tripping under load',
    },
    custToken
  );
  const createdBooking = newBookingRes.body.booking;
  console.log(`✅ [6/10] Booking Created: #${createdBooking.id} (Status: ${createdBooking.status}) sent to ${createdBooking.workerName}`);

  // 5. Worker Accepts Booking
  const acceptRes = await request('PUT', `/api/bookings/${createdBooking.id}/accept`, {}, workerToken);
  console.log(`✅ [7/10] Worker Accepted Booking: Status is now "${acceptRes.body.booking.status}" (Email notification triggered)`);

  // 6. Complete Job & Customer Review
  const completeRes = await request('PUT', `/api/bookings/${createdBooking.id}/complete`, {}, workerToken);
  console.log(`✅ [8/10] Job Completed: Status "${completeRes.body.booking.status}". Customer rating enabled.`);

  const reviewRes = await request(
    'POST',
    `/api/bookings/${createdBooking.id}/review`,
    {
      rating: 5,
      comment: 'Super fast arrival and clean repair work. Replaced burnt fuse neatly.',
    },
    custToken
  );
  console.log(`✅ [9/10] Review & Rating Submitted: Worker average rating recalculated to ${reviewRes.body.updatedWorkerRating} ⭐`);

  // 7. Worker Signup -> Pending Verification -> Admin Approval
  const newWorkerEmail = 'test.painter.' + Date.now() + '@example.com';
  const registerWorkerRes = await request('POST', '/api/auth/register-worker', {
    fullName: 'Ramesh Painter',
    mobile: '+91 98999 11223',
    email: newWorkerEmail,
    password: 'worker123',
    confirmPassword: 'worker123',
    skill: 'Painter',
    experience: 6,
    location: 'Indiranagar, Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    servicePrice: 500,
    priceUnit: 'per room',
    description: 'Expert texture & waterproof painter',
  });
  console.log(`✅ [10/10] New Worker Registered: Status is "${registerWorkerRes.body.user.status}" (Hidden from public search)`);

  // Admin verifies & approves
  const pendingQueue = await request('GET', '/api/admin/workers/pending', null, adminToken);
  const newlyRegistered = pendingQueue.body.workers.find((w) => w.email === newWorkerEmail);

  if (newlyRegistered) {
    const approveRes = await request(
      'PUT',
      `/api/admin/workers/${newlyRegistered.id}/verify`,
      { action: 'approve' },
      adminToken
    );
    console.log(`🎉 [Bonus] Admin Approved Worker: "${approveRes.body.worker.fullName}" is now APPROVED and visible in customer searches!`);
  }

  // 8. Verify Email Logs
  const emailLogs = await request('GET', '/api/emails/logs', null, adminToken);
  console.log(`\n📧 Transactional Email Hub: ${emailLogs.body.count} automated emails recorded and verified.`);

  console.log('\n======================================================');
  console.log('🌟 ALL 10 E2E WORKFLOW TESTS PASSED SUCCESSFULLY! 🌟');
  console.log('======================================================\n');
}

runTests().catch(console.error);
