import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(root, 'db.json')
const usersPath = path.join(root, 'default-users.txt')
const port = Number(process.env.PORT || 3001)
const secret = process.env.LOCAL_AUTH_SECRET || 'ucl-connect-local-development-secret'

const readDb = () => JSON.parse(readFileSync(dbPath, 'utf8'))
const writeDb = (db) => writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`)
const now = () => new Date().toISOString()
const hashPassword = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const verifyPassword = (password, stored) => { const [salt, hash] = stored.split(':'); if (!salt || !hash) return false; const actual = scryptSync(password, salt, 64); return timingSafeEqual(actual, Buffer.from(hash, 'hex')) }
const tokenFor = (user) => { const payload = Buffer.from(JSON.stringify({ uid: user.uid, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url'); return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}` }
const userView = (user) => { const { passwordHash: _passwordHash, ...safeUser } = user; return safeUser }

function seedUsers() {
  const db = readDb()
  if (db.users.length) return
  const lines = readFileSync(usersPath, 'utf8').split(/\r?\n/).filter((line) => line && !line.startsWith('#'))
  db.users = lines.map((line) => { const [email, password, displayName, role, department = ''] = line.split('|').map((value) => value.trim()); const uid = `demo-${email.split('@')[0].replace(/[^a-z0-9]/gi, '-')}`; return { uid, email: email.toLowerCase(), passwordHash: hashPassword(password), displayName, role, department: department || null, faculty: role === 'STUDENT' ? 'Computing' : null, programme: role === 'STUDENT' ? 'BSc Computer Science' : null, yearGroup: role === 'STUDENT' ? 2 : null, createdAt: now(), updatedAt: now(), isActive: true } })
  writeDb(db)
}
seedUsers()

const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(body)) }
const readBody = async (req) => { let body = ''; for await (const chunk of req) body += chunk; return body ? JSON.parse(body) : {} }
const authUser = (req, db) => { const header = req.headers.authorization || ''; const token = header.startsWith('Bearer ') ? header.slice(7) : ''; const [payload, signature] = token.split('.'); if (!payload || !signature) return null; const expected = createHmac('sha256', secret).update(payload).digest('base64url'); if (signature !== expected) return null; try { const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()); if (parsed.exp < Date.now()) return null; return db.users.find((user) => user.uid === parsed.uid && user.isActive) || null } catch { return null } }
const staff = (user) => user && user.role !== 'STUDENT'
const allowedFor = (user, collection, method) => { if (!user) return false; if (method === 'GET') return true; if (user.role === 'ADMIN') return true; const domain = { rooms: ['FACILITIES'], roomBookings: ['FACILITIES'], facilityIssues: ['FACILITIES'], academicSupportRequests: ['ACADEMIC'], feedback: ['ADMINISTRATIVE'], lostFoundItems: ['FACILITIES'], events: ['ADMINISTRATIVE', 'SOCIETY_MANAGER'], societies: ['SOCIETY_MANAGER'] }[collection]; return Boolean(domain?.includes(user.role) || (collection === 'roomBookings' && user.role === 'FACILITIES')) }

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const url = new URL(req.url, `http://localhost:${port}`)
  const db = readDb()
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, backend: 'local-json' })
    if (url.pathname === '/api/auth/register' && req.method === 'POST') { const input = await readBody(req); const email = String(input.email || '').trim().toLowerCase(); if (!email.endsWith('@ucl.lk')) return send(res, 400, { message: 'Use a UCL email ending in @ucl.lk.' }); if (db.users.some((user) => user.email === email)) return send(res, 409, { message: 'An account with this email already exists.' }); if (!input.password || input.password.length < 8) return send(res, 400, { message: 'Password must be at least 8 characters.' }); const user = { uid: randomUUID(), email, passwordHash: hashPassword(input.password), displayName: String(input.displayName || '').trim(), role: 'STUDENT', staffDepartment: null, faculty: input.faculty || null, programme: input.programme || null, yearGroup: input.yearGroup || null, createdAt: now(), updatedAt: now(), isActive: true }; db.users.push(user); writeDb(db); return send(res, 201, { token: tokenFor(user), user: userView(user) }) }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') { const input = await readBody(req); const user = db.users.find((item) => item.email === String(input.email || '').trim().toLowerCase()); if (!user || !user.isActive || !verifyPassword(String(input.password || ''), user.passwordHash)) return send(res, 401, { message: 'Incorrect email or password.' }); return send(res, 200, { token: tokenFor(user), user: userView(user) }) }
    if (url.pathname === '/api/auth/me' && req.method === 'GET') { const user = authUser(req, db); return user ? send(res, 200, { user: userView(user) }) : send(res, 401, { message: 'Your session has expired.' }) }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') return send(res, 200, { ok: true })

    const user = authUser(req, db)
    if (!user) return send(res, 401, { message: 'Authentication required.' })
    if (url.pathname === '/api/profile' && req.method === 'PATCH') { const input = await readBody(req); const current = db.users.find((item) => item.uid === user.uid); Object.assign(current, { displayName: input.displayName ?? current.displayName, faculty: input.faculty ?? current.faculty, programme: input.programme ?? current.programme, yearGroup: input.yearGroup ?? current.yearGroup, updatedAt: now() }); writeDb(db); return send(res, 200, { user: userView(current) }) }
    const match = url.pathname.match(/^\/api\/collections\/([^/]+)(?:\/([^/]+))?$/)
    if (!match) return send(res, 404, { message: 'Route not found.' })
    const [, collection, id] = match
    if (!db[collection]) db[collection] = []
    if (!allowedFor(user, collection, req.method)) return send(res, 403, { message: 'You do not have permission for this resource.' })
    if (req.method === 'GET') { let records = db[collection]; const requestedBy = url.searchParams.get('requestedBy'); const studentId = url.searchParams.get('studentId'); if (requestedBy) records = records.filter((item) => item.requestedBy === requestedBy); if (studentId) records = records.filter((item) => item.studentId === studentId); if (!staff(user)) records = records.filter((item) => item.requestedBy === user.uid || item.studentId === user.uid || item.submittedBy === user.uid || collection === 'rooms'); return send(res, 200, { items: records }) }
    if (req.method === 'POST') { const input = await readBody(req); const created = { ...input, id: input.id || randomUUID(), createdAt: now() }; if (['eventInterests', 'societyInterests'].includes(collection) && db[collection].some((item) => item.id === created.id)) return send(res, 409, { message: 'This interest has already been recorded.' }); if (collection === 'roomBookings' && db.roomBookings.some((item) => item.roomId === created.roomId && item.date === created.date && ['PENDING', 'APPROVED'].includes(item.status) && item.startTime < created.endTime && created.startTime < item.endTime)) return send(res, 409, { message: 'That room is already booked for the selected time.' }); db[collection].push(created); writeDb(db); return send(res, 201, { item: created }) }
    const index = db[collection].findIndex((item) => item.id === id); if (index < 0) return send(res, 404, { message: 'Record not found.' }); if (req.method === 'PATCH') { const input = await readBody(req); db[collection][index] = { ...db[collection][index], ...input, updatedAt: now() }; writeDb(db); return send(res, 200, { item: db[collection][index] }) } if (req.method === 'DELETE') { db[collection].splice(index, 1); writeDb(db); return send(res, 204, {}) }
    return send(res, 405, { message: 'Method not allowed.' })
  } catch (error) { console.error(error); return send(res, 500, { message: 'Local backend error.' }) }
}

createServer(handle).listen(port, () => console.log(`UCL Connect local backend listening on http://localhost:${port}`))
