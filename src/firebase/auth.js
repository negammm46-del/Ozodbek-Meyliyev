import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase.js';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Translates Firebase Auth error codes into clear Uzbek messages & Console guidance.
 * @param {unknown} err
 */
export function formatFirebaseAuthError(err) {
  const code =
    err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  const msg = err instanceof Error ? err.message : String(err);

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Bu kirish usuli Firebase Console → Authentication → Sign-in method bo‘limida hali yoqilmagan. Iltimos Google yoki Email/Password provayderini yoqing.';
    case 'auth/email-already-in-use':
      return 'Bu email manzili bilan hisob allaqachon ro‘yxatdan o‘tgan.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email yoki parol noto‘g‘ri kiritildi.';
    case 'auth/weak-password':
      return 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.';
    case 'auth/invalid-email':
      return 'Email manzili formati noto‘g‘ri.';
    case 'auth/popup-closed-by-user':
      return 'Google kirish oynasi foydalanuvchi tomonidan yopildi.';
    case 'auth/popup-blocked':
      return 'Brauzer pop-up oynani blokladi. Iltimos ushbu sayt uchun pop-up ruxsatini bering.';
    case 'auth/too-many-requests':
      return 'Juda ko‘p urinish qilindi. Biroz kutib qayta urinib ko‘ring.';
    case 'auth/requires-recent-login':
      return 'Xavfsizlik uchun avval tizimdan chiqib, qayta kiring va parolni yangilang.';
    default:
      return msg || 'Firebase autentifikatsiya xatosi yuz berdi.';
  }
}

function assertAuthReady() {
  if (!firebaseConfigured || !auth) {
    throw new Error(
      'Firebase konfiguratsiyasi topilmadi. .env fayliga VITE_FIREBASE_* kalitlarini kiriting.'
    );
  }
  return auth;
}

export async function signInWithGoogle() {
  const firebaseAuth = assertAuthReady();
  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  return credential.user;
}

/**
 * Registers a new user via Email + Password and sends email verification.
 * @param {{ email: string; password: string; displayName: string }} params
 */
export async function registerWithEmail({ email, password, displayName }) {
  const firebaseAuth = assertAuthReady();
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password
  );
  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  try {
    await sendEmailVerification(credential.user);
  } catch {
    // Email send rate limit or unconfigured template should not block registration
  }
  return credential.user;
}

/**
 * Signs in with Email + Password.
 * @param {{ email: string; password: string }} params
 */
export async function loginWithEmail({ email, password }) {
  const firebaseAuth = assertAuthReady();
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password
  );
  return credential.user;
}

/**
 * Sends Firebase password reset email.
 * @param {string} email
 */
export async function resetPassword(email) {
  const firebaseAuth = assertAuthReady();
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

/**
 * Resends verification email to the signed-in user.
 */
export async function resendVerificationEmail() {
  const firebaseAuth = assertAuthReady();
  if (!firebaseAuth.currentUser) {
    throw new Error('Avval tizimga kiring.');
  }
  await sendEmailVerification(firebaseAuth.currentUser);
}

/**
 * Changes password after re-authenticating current credentials.
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changeUserPassword(currentPassword, newPassword) {
  const firebaseAuth = assertAuthReady();
  const user = firebaseAuth.currentUser;
  if (!user || !user.email) {
    throw new Error('Email parol bilan kirgan foydalanuvchi topilmadi.');
  }
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export async function logoutFirebase() {
  if (auth) {
    await signOut(auth);
  }
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

/**
 * Subscribes to Firebase Auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 */
export function subscribeToAuthState(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Exchanges Firebase ID Token with the trusted GeoWorld Express backend
 * to issue HTTP-only session cookies and read trusted PRO / Admin entitlements.
 * @param {import('firebase/auth').User} firebaseUser
 */
export async function syncFirebaseBackendSession(firebaseUser) {
  const idToken = await firebaseUser.getIdToken();
  const res = await fetch('/api/auth/firebase-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}
