import { createContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  signUpWithEmail,
  logInWithEmail,
  logInWithGoogle,
  logOut as firebaseLogOut,
  resendVerificationEmail,
  requestPasswordReset,
} from '../core/authLogic';
import authService from '../services/auth.service';
import recurringService from '../services/recurring.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // Postgres-side profile
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async () => {
    try {
      const me = await authService.getMe();
      setProfile(me);
      // Best-effort: catch up any due recurring transactions. No
      // background job runner exists in this app, so this is the closest
      // approximation to "automatically create future recurring
      // transactions" — it runs whenever the user opens the app.
      recurringService.process().catch(() => {});
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [syncProfile]);

  const signup = useCallback(
    async ({ name, email, password, rememberMe }) => {
      const user = await signUpWithEmail({ name, email, password, rememberMe });
      await syncProfile();
      return user;
    },
    [syncProfile]
  );

  const login = useCallback(
    async ({ email, password, rememberMe }) => {
      const user = await logInWithEmail({ email, password, rememberMe });
      await syncProfile();
      return user;
    },
    [syncProfile]
  );

  const loginWithGoogle = useCallback(
    async (rememberMe) => {
      const user = await logInWithGoogle({ rememberMe });
      await syncProfile();
      return user;
    },
    [syncProfile]
  );

  const logout = useCallback(async () => {
    await firebaseLogOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback((updated) => {
    setProfile(updated);
  }, []);

  const resendVerification = useCallback(() => resendVerificationEmail(), []);
  const resetPassword = useCallback((email) => requestPasswordReset(email), []);

  const value = {
    user: profile, // Postgres profile — id, name, currency, etc.
    firebaseUser, // Firebase user — emailVerified, uid, providerData, etc.
    isEmailVerified: !!firebaseUser?.emailVerified,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    resendVerification,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
