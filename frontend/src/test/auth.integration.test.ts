import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth'

// Exercises real Firebase Authentication against the local emulator (not a
// mock) — see package.json `test:auth` script. Covers AUTHENTICATION: valid
// login / invalid login (test plan section 23).

let app: FirebaseApp
let auth: Auth

const EMAIL = `auth-test-${Date.now()}@uclone.lk`
const PASSWORD = 'CorrectHorse123!'

beforeAll(async () => {
  app = initializeApp({ apiKey: 'demo-api-key', projectId: 'ucl-one-demo-auth-test', authDomain: 'localhost' }, 'auth-integration-test')
  auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
  await signOut(auth)
})

afterAll(async () => {
  await deleteApp(app)
})

describe('Firebase Authentication (emulator)', () => {
  it('logs in successfully with the correct password', async () => {
    const credential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
    expect(credential.user.email).toBe(EMAIL)
    await signOut(auth)
  })

  it('rejects login with an incorrect password', async () => {
    await expect(signInWithEmailAndPassword(auth, EMAIL, 'wrong-password')).rejects.toThrow()
  })

  it('rejects login for an email that was never registered', async () => {
    await expect(signInWithEmailAndPassword(auth, 'nobody@uclone.lk', 'whatever123')).rejects.toThrow()
  })
})
