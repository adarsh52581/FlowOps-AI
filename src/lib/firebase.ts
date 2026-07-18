/**
 * firebase.ts — Firebase RTDB initialization and connectivity monitoring.
 *
 * WHY Realtime Database:
 * Storing crowd state (Record<string, GateData>) as a single flat JSON tree fits
 * the store's O(1) keyed layout perfectly, with lower network and quota overhead
 * compared to Firestore collections.
 *
 * WHY info/connected:
 * Monitors DB connection state in real-time, allowing the UI to show a "Local Only"
 * fallback badge if Firestore/RTDB is unreachable (e.g. offline, firewalls, quota blocks).
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'

const firebaseConfig = {
  projectId:     (import.meta.env.VITE_FIREBASE_PROJECT_ID || '') as string,
  databaseURL:   (import.meta.env.VITE_FIREBASE_DATABASE_URL || '') as string,
  apiKey:        (import.meta.env.VITE_FIREBASE_API_KEY || '') as string,
  authDomain:    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '') as string,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '') as string,
  appId:         (import.meta.env.VITE_FIREBASE_APP_ID || '') as string,
}

if (!firebaseConfig.apiKey) {
  console.warn('[firebase] No VITE_FIREBASE_API_KEY set — running in local-only fallback mode.')
}

// Initialize single instance of App and Database
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const db  = getDatabase(app)

export { app, db }

/**
 * Monitors connectivity to Firebase Realtime Database.
 *
 * @param callback - called with true when connected, false otherwise
 * @returns unsubscribe function
 */
export function monitorDbConnection(callback: (connected: boolean) => void): () => void {
  try {
    const connectedRef = ref(db, '.info/connected')
    return onValue(connectedRef, (snap) => {
      callback(snap.val() === true)
    })
  } catch (err) {
    console.error('[firebase] Failed to start connectivity listener:', err)
    callback(false)
    return () => {}
  }
}
