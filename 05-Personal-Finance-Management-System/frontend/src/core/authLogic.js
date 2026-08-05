/**
 * Firebase auth operations, isolated from any React/DOM code. This is the
 * "business logic" layer for authentication — AuthContext (UI-side state)
 * calls these functions but never touches the Firebase SDK directly. If
 * this app is ever ported to React Native, this file (plus services/*.js)
 * is the only auth code that needs a platform-specific swap; components
 * and hooks stay the same.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Firebase's default "email enumeration protection" merges wrong-password
// and no-such-account into one error code (auth/invalid-credential) unless
// it's disabled in Firebase Console → Authentication → Settings → User
// account linking. We map both the old and new codes so the friendlier,
// more specific messages are used whenever Firebase does report them.
const ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
};

function friendlyError(err) {
  const message = ERROR_MESSAGES[err.code] || 'Something went wrong. Please try again.';
  const wrapped = new Error(message);
  wrapped.code = err.code;
  return wrapped;
}

export async function applyPersistence(rememberMe) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}

export async function signUpWithEmail({ name, email, password, rememberMe }) {
  try {
    await applyPersistence(rememberMe);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await firebaseUpdateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    return credential.user;
  } catch (err) {
    throw friendlyError(err);
  }
}

export async function logInWithEmail({ email, password, rememberMe }) {
  try {
    await applyPersistence(rememberMe);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (err) {
    throw friendlyError(err);
  }
}

export async function logInWithGoogle({ rememberMe } = {}) {
  try {
    await applyPersistence(rememberMe ?? true);
    const credential = await signInWithPopup(auth, googleProvider);
    return credential.user;
  } catch (err) {
    throw friendlyError(err);
  }
}

export async function logOut() {
  await signOut(auth);
}

export async function resendVerificationEmail() {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw friendlyError(err);
  }
}
