import { updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  OperationType,
  auth,
  db,
  firebaseConfigured,
  handleFirestoreError,
  storage,
} from './firebase.js';
import { updateUserProfileFields } from './firestore.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates that the file is an image <= 5MB.
 * @param {File} file
 */
function validateImageFile(file) {
  if (!file) throw new Error('Rasm fayli tanlanmadi.');
  if (!file.type.startsWith('image/')) {
    throw new Error('Faqat rasm fayllari (PNG, JPG, WebP) yuklanadi.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Rasm hajmi 5 MB dan oshmasligi kerak.');
  }
}

function assertStorageReady() {
  if (!firebaseConfigured || !storage) {
    throw new Error(
      'Firebase Storage sozlanmagan. Firebase loyiha konfiguratsiyasini tekshiring.'
    );
  }
  return storage;
}

/**
 * Uploads an image file to Firebase Storage and tracks upload progress.
 * @param {string} storagePath
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 */
function uploadWithProgress(storagePath, file, onProgress) {
  const firebaseStorage = assertStorageReady();
  const storageRef = ref(firebaseStorage, storagePath);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });
    task.on(
      'state_changed',
      (snap) => {
        if (snap.totalBytes > 0) {
          onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Uploads a user profile avatar to Firebase Storage and updates Auth + Firestore photoURL.
 * @param {string} uid
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 */
export async function uploadProfileAvatar(uid, file, onProgress) {
  validateImageFile(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const storagePath = `users/${uid}/avatar/${Date.now()}_${safeName}`;
  const downloadUrl = await uploadWithProgress(storagePath, file, onProgress);

  if (auth?.currentUser && auth.currentUser.uid === uid) {
    await updateProfile(auth.currentUser, { photoURL: downloadUrl }).catch(() => {});
  }
  await updateUserProfileFields(uid, { photoURL: downloadUrl });

  if (db) {
    const uploadId = `av_${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', uid, 'mediaUploads', uploadId), {
        uid,
        fileName: safeName,
        storagePath,
        downloadUrl,
        category: 'avatar',
        title: 'Profil rasmi',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${uid}/mediaUploads/${uploadId}`
      );
    }
  }

  return { storagePath, downloadUrl };
}

/**
 * Uploads user learning image or admin lesson image to Firebase Storage + logs metadata.
 * @param {string} uid
 * @param {File} file
 * @param {string} title
 * @param {'learning' | 'admin-lesson'} [category]
 * @param {(pct: number) => void} [onProgress]
 */
export async function uploadEducationalMedia(
  uid,
  file,
  title,
  category = 'learning',
  onProgress
) {
  validateImageFile(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const storagePath =
    category === 'admin-lesson'
      ? `publicContent/lessons/${Date.now()}_${safeName}`
      : `users/${uid}/learningMedia/${Date.now()}_${safeName}`;

  const downloadUrl = await uploadWithProgress(storagePath, file, onProgress);

  if (db) {
    const uploadId = `med_${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', uid, 'mediaUploads', uploadId), {
        uid,
        fileName: safeName,
        storagePath,
        downloadUrl,
        category,
        title: (title || safeName).slice(0, 160),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        `users/${uid}/mediaUploads/${uploadId}`
      );
    }
  }

  return { storagePath, downloadUrl };
}

/**
 * Deletes a file from Firebase Storage.
 * @param {string} storagePath
 */
export async function deleteStorageMedia(storagePath) {
  const firebaseStorage = assertStorageReady();
  await deleteObject(ref(firebaseStorage, storagePath));
}
