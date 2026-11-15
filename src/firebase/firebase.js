import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import provisionedConfig from '../../firebase-applet-config.json';

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || provisionedConfig.apiKey || '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || provisionedConfig.authDomain || '',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || provisionedConfig.projectId || '',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    provisionedConfig.storageBucket ||
    '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    provisionedConfig.messagingSenderId ||
    '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || provisionedConfig.appId || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    provisionedConfig.firestoreDatabaseId ||
    '(default)',
  oAuthClientId: provisionedConfig.oAuthClientId || '',
};

export const firebaseConfigStatus = {
  configured: Boolean(
    envConfig.apiKey && envConfig.authDomain && envConfig.projectId && envConfig.appId
  ),
  source: import.meta.env.VITE_FIREBASE_API_KEY
    ? 'env'
    : provisionedConfig.projectId
    ? 'provisioned-config'
    : 'missing',
  projectId: envConfig.projectId,
  authDomain: envConfig.authDomain,
  firestoreDatabaseId: envConfig.firestoreDatabaseId,
  storageBucket: envConfig.storageBucket,
  oAuthClientId: envConfig.oAuthClientId,
};

export const firebaseConfigured = firebaseConfigStatus.configured;

export const app = firebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: envConfig.apiKey,
        authDomain: envConfig.authDomain,
        projectId: envConfig.projectId,
        storageBucket: envConfig.storageBucket,
        messagingSenderId: envConfig.messagingSenderId,
        appId: envConfig.appId,
      })
  : null;

export const auth = app ? getAuth(app) : null;

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

function createFirestoreInstance() {
  if (!app) return null;
  const dbId =
    envConfig.firestoreDatabaseId && envConfig.firestoreDatabaseId !== '(default)'
      ? envConfig.firestoreDatabaseId
      : undefined;
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId
    );
  } catch {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db = createFirestoreInstance();
export const storage = app ? getStorage(app) : null;

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

/**
 * Formats and throws Firestore errors using the mandatory FirestoreErrorInfo structure.
 * @param {unknown} error
 * @param {string} operationType
 * @param {string | null} path
 */
export function handleFirestoreError(error, operationType, path) {
  const user = auth?.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid ?? null,
      email: user?.email ?? null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId ?? null,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Tests Firestore server connectivity on initial app boot.
 */
export async function testFirestoreConnection() {
  if (!db) return { connected: false, reason: 'missing-config' };
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, reason: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { connected: false, reason: 'offline' };
    }
    return { connected: true, reason: msg };
  }
}

if (typeof window !== 'undefined' && db) {
  void testFirestoreConnection();
}
