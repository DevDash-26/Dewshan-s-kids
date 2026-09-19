// Seeds demo accounts and reference data into the Firebase Local Emulator
// Suite (Auth + Firestore) so the prototype is demoable immediately.
//
// This script ONLY ever targets the emulator (it hard-fails if the emulator
// env vars aren't set) — it must never be pointed at a live Firebase
// project, since it creates well-known demo passwords.
//
// Usage: firebase emulators:exec --project ucl-one-demo "node scripts/seed-emulator.mjs"
// or, with emulators already running: node scripts/seed-emulator.mjs

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

const app = initializeApp({ projectId: 'ucl-one-demo' });
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_USERS = [
  {
    email: 'student.demo@uclone.lk',
    password: 'Demo123!',
    displayName: 'Sanuli Fernando',
    role: 'STUDENT',
    faculty: 'Faculty of Computing',
    programme: 'BSc Software Engineering',
    yearGroup: 2,
  },
  {
    email: 'staff.demo@uclone.lk',
    password: 'Demo123!',
    displayName: 'Mr. Nuwan Silva',
    role: 'STAFF',
    faculty: null,
    programme: null,
    yearGroup: null,
  },
  {
    email: 'admin.demo@uclone.lk',
    password: 'Demo123!',
    displayName: 'Ms. Kavindi Jayasuriya',
    role: 'ADMIN',
    faculty: null,
    programme: null,
    yearGroup: null,
  },
];

const DEMO_ROOMS = [
  { id: 'a-204', name: 'Room A204', building: 'Block A', capacity: 30, features: ['Projector', 'Whiteboard'] },
  { id: 'a-105', name: 'Room A105', building: 'Block A', capacity: 12, features: ['Whiteboard'] },
  { id: 'b-201', name: 'Room B201', building: 'Block B', capacity: 50, features: ['Projector', 'PA System'] },
  { id: 'lib-discussion-1', name: 'Library Discussion Room 1', building: 'Library', capacity: 6, features: ['Whiteboard'] },
];

async function seedUsers() {
  for (const user of DEMO_USERS) {
    let uid;
    try {
      const existing = await auth.getUserByEmail(user.email);
      uid = existing.uid;
    } catch {
      const created = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      uid = created.uid;
    }

    await db.doc(`users/${uid}`).set({
      uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      staffDepartment: null,
      faculty: user.faculty,
      programme: user.programme,
      yearGroup: user.yearGroup,
      createdAt: new Date().toISOString(),
    });

    console.log(`[seed] ${user.role} account ready: ${user.email} / ${user.password}`);
  }
}

async function seedRooms() {
  const batch = db.batch();
  for (const room of DEMO_ROOMS) {
    const { id, ...data } = room;
    batch.set(db.doc(`rooms/${id}`), data);
  }
  await batch.commit();
  console.log(`[seed] ${DEMO_ROOMS.length} demo rooms created`);
}

async function main() {
  await seedUsers();
  await seedRooms();
  console.log('[seed] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
