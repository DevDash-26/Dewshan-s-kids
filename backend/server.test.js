const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./server');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { response, body };
}

async function login(email, password) {
  const result = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  assert.equal(result.response.status, 200, `login should succeed for ${email}`);
  return result.body.token;
}

test('valid login works', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  assert.ok(token);
});

test('invalid login is rejected', async () => {
  const result = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nimali@student.ucl.ac.lk', password: 'wrong' })
  });
  assert.equal(result.response.status, 401);
});

test('student cannot create official announcement', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  const result = await request('/api/announcements', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Student spoof',
      description: 'This should not be allowed',
      category: 'ANNOUNCEMENT',
      audience: 'ALL'
    })
  });
  assert.equal(result.response.status, 403);
});

test('staff can create announcement', async () => {
  const token = await login('staff@ucl.ac.lk', 'staff123');
  const result = await request('/api/announcements', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Faculty hack workshop',
      description: 'A workshop for students to work on upcoming innovation projects',
      category: 'ANNOUNCEMENT',
      audience: 'FACULTY',
      faculty: 'Computing'
    })
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.announcement.title, 'Faculty hack workshop');
});

test('events list and interest registration works', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  const listResult = await request('/api/events', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(listResult.response.status, 200);
  assert.ok(Array.isArray(listResult.body.events));

  const interestResult = await request('/api/events/e-2/interest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(interestResult.response.status, 201);

  const duplicateResult = await request('/api/events/e-2/interest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(duplicateResult.response.status, 409);
});

test('societies interest works', async () => {
  const token = await login('rashid@student.ucl.ac.lk', 'student123');
  const result = await request('/api/societies/s-1/interest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.message, 'Society interest recorded.');
});

test('room conflict detection rejects overlap', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  const result = await request('/api/rooms/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      roomId: 'r-1',
      date: '2026-09-25',
      startTime: '14:00',
      endTime: '15:00',
      reason: 'clash test'
    })
  });
  assert.equal(result.response.status, 409);
});

test('lost found validation required fields', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  const result = await request('/api/lost-found', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Incomplete report' })
  });
  assert.equal(result.response.status, 400);
});

test('ai empty query is rejected', async () => {
  const token = await login('nimali@student.ucl.ac.lk', 'student123');
  const result = await request('/api/ai', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question: '   ' })
  });
  assert.equal(result.response.status, 400);
});
