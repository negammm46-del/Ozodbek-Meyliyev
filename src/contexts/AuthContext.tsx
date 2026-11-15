import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  firebaseConfigStatus,
  firebaseConfigured,
  testFirestoreConnection,
} from '../firebase/firebase.js';
import {
  formatFirebaseAuthError,
  loginWithEmail,
  logoutFirebase,
  registerWithEmail,
  resendVerificationEmail,
  resetPassword,
  signInWithGoogle,
  subscribeToAuthState,
  syncFirebaseBackendSession,
} from '../firebase/auth.js';
import {
  ensureUserProfile,
  getLearningProgress,
  subscribeToSubscription,
  subscribeToUserProfile,
} from '../firebase/firestore.js';
import { type SubscriptionInfo } from '../types/user';

export interface PromoRedeemResponse {
  ok: boolean;
  code: 'FREE100' | 'OZODBRO';
  discountPercent: number;
  finalPrice: number;
  headline: string;
  subheadline: string;
  redemption: {
    id: string;
    uid: string;
    code: 'FREE100' | 'OZODBRO';
    discountPercent: number;
    finalPrice: number;
    subscriptionType: 'promo' | 'lifetime';
    subscriptionPlan: 'monthly' | 'lifetime';
    subscriptionStart: string;
    subscriptionEnd: string | null;
    proStatus: 'active' | 'expired';
    lifetimePro: boolean;
  };
  user: Record<string, unknown>;
  subscription: SubscriptionInfo;
}

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  firestoreProfile: Record<string, unknown> | null;
  firestoreProgress: Record<string, unknown> | null;
  subscription: SubscriptionInfo | null;
  authReady: boolean;
  authLoading: boolean;
  isAdmin: boolean;
  firestoreConnected: boolean;
  firebaseConfig: typeof firebaseConfigStatus;
  signInGoogle: () => Promise<{
    firebaseUser: FirebaseUser;
    backendPayload: Record<string, unknown> | null;
    isNew: boolean;
  }>;
  registerEmail: (params: {
    email: string;
    password: string;
    username: string;
    countryCode: string;
  }) => Promise<{
    firebaseUser: FirebaseUser;
    backendPayload: Record<string, unknown> | null;
    isNew: boolean;
  }>;
  loginEmail: (params: { email: string; password: string }) => Promise<{
    firebaseUser: FirebaseUser;
    backendPayload: Record<string, unknown> | null;
  }>;
  sendReset: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  logout: () => Promise<void>;
  redeemPromoCode: (code: string) => Promise<PromoRedeemResponse>;
  refreshEntitlement: () => Promise<SubscriptionInfo | null>;
  formatAuthError: (err: unknown) => string;
}

function normalizeSubscription(sub: SubscriptionInfo | null): SubscriptionInfo | null {
  if (!sub) return null;
  const isLifetime =
    Boolean(sub.lifetimePro) ||
    sub.subscriptionType === 'lifetime' ||
    sub.subscriptionPlan === 'lifetime';
  if (isLifetime) {
    return {
      ...sub,
      subscriptionStatus: 'active',
      subscriptionType: 'lifetime',
      subscriptionPlan: 'lifetime',
      subscriptionEndDate: null,
      proStatus: 'active',
      lifetimePro: true,
      entitlementStatus: 'pro',
    };
  }
  const endDate = sub.subscriptionEndDate;
  const isExpired = Boolean(
    endDate && Date.now() >= new Date(endDate).getTime()
  );
  if (isExpired) {
    return {
      ...sub,
      subscriptionStatus: 'expired',
      subscriptionType: 'free',
      subscriptionPlan: 'free',
      proStatus: 'expired',
      lifetimePro: false,
      entitlementStatus: 'free',
    };
  }
  return sub;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firestoreProfile, setFirestoreProfile] = useState<Record<string, unknown> | null>(
    null
  );
  const [firestoreProgress, setFirestoreProgress] = useState<Record<string, unknown> | null>(
    null
  );
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(firebaseConfigured);

  useEffect(() => {
    testFirestoreConnection()
      .then((res) => setFirestoreConnected(res.connected))
      .catch(() => setFirestoreConnected(false));
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubSub: (() => void) | undefined;

    const unsubAuth = subscribeToAuthState(async (fbUser) => {
      setFirebaseUser(fbUser);
      unsubProfile?.();
      unsubSub?.();

      if (!fbUser) {
        setFirestoreProfile(null);
        setFirestoreProgress(null);
        setSubscription(null);
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      try {
        await ensureUserProfile(fbUser);
        const [lp, backend] = await Promise.all([
          getLearningProgress(fbUser.uid),
          syncFirebaseBackendSession(fbUser),
        ]);
        if (lp) setFirestoreProgress(lp);
        if (backend?.subscription) {
          setSubscription(
            normalizeSubscription(backend.subscription as SubscriptionInfo)
          );
        }
        if (typeof backend?.isAdmin === 'boolean') {
          setIsAdmin(backend.isAdmin);
        } else {
          setIsAdmin(
            Boolean(
              fbUser.emailVerified &&
                fbUser.email?.toLowerCase() === 'negammm46@gmail.com'
            )
          );
        }

        unsubProfile = subscribeToUserProfile(fbUser.uid, (prof) => {
          setFirestoreProfile(prof);
        });
        unsubSub = subscribeToSubscription(fbUser.uid, (subDoc) => {
          if (subDoc) {
            const normalizedFs = normalizeSubscription(
              subDoc as unknown as SubscriptionInfo
            );
            setSubscription((prev) => {
              if (!normalizedFs) return prev;
              if (
                prev?.entitlementStatus === 'pro' &&
                normalizedFs.entitlementStatus !== 'pro'
              ) {
                return prev;
              }
              return normalizedFs;
            });
          }
        });
      } catch {
        // Handled cleanly inside firestore/auth layers
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
      unsubSub?.();
    };
  }, []);

  const signInGoogleHandler = useCallback(async () => {
    setAuthLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const [{ isNew }, backendPayload] = await Promise.all([
        ensureUserProfile(fbUser),
        syncFirebaseBackendSession(fbUser),
      ]);
      if (backendPayload?.subscription) {
        setSubscription(
          normalizeSubscription(backendPayload.subscription as SubscriptionInfo)
        );
      }
      return { firebaseUser: fbUser, backendPayload, isNew };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const registerEmailHandler = useCallback(
    async ({
      email,
      password,
      username,
      countryCode,
    }: {
      email: string;
      password: string;
      username: string;
      countryCode: string;
    }) => {
      setAuthLoading(true);
      try {
        const fbUser = await registerWithEmail({
          email,
          password,
          displayName: username,
        });
        const [{ isNew }, backendPayload] = await Promise.all([
          ensureUserProfile(fbUser, {
            displayName: username,
            country: countryCode,
          }),
          syncFirebaseBackendSession(fbUser),
        ]);
        if (backendPayload?.subscription) {
          setSubscription(
            normalizeSubscription(backendPayload.subscription as SubscriptionInfo)
          );
        }
        return { firebaseUser: fbUser, backendPayload, isNew };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const loginEmailHandler = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthLoading(true);
      try {
        const fbUser = await loginWithEmail({ email, password });
        await ensureUserProfile(fbUser);
        const backendPayload = await syncFirebaseBackendSession(fbUser);
        if (backendPayload?.subscription) {
          setSubscription(
            normalizeSubscription(backendPayload.subscription as SubscriptionInfo)
          );
        }
        return { firebaseUser: fbUser, backendPayload };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const logoutHandler = useCallback(async () => {
    setAuthLoading(true);
    try {
      await logoutFirebase();
      setFirebaseUser(null);
      setFirestoreProfile(null);
      setFirestoreProgress(null);
      setSubscription(null);
      setIsAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const refreshEntitlementHandler = useCallback(async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/pro/verify-status', {
        method: 'POST',
        headers,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const nextSub = normalizeSubscription(
        (data.subscription as SubscriptionInfo) || null
      );
      if (nextSub) setSubscription(nextSub);
      return nextSub;
    } catch {
      return null;
    }
  }, [firebaseUser]);

  const redeemPromoCodeHandler = useCallback(
    async (code: string): Promise<PromoRedeemResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/pro/redeem-promo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Promo kodni qo‘llab bo‘lmadi.');
      }
      const normalizedSub = normalizeSubscription(
        data.subscription as SubscriptionInfo
      );
      if (normalizedSub) {
        setSubscription(normalizedSub);
      }
      return data as PromoRedeemResponse;
    },
    [firebaseUser]
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        firestoreProfile,
        firestoreProgress,
        subscription,
        authReady,
        authLoading,
        isAdmin,
        firestoreConnected,
        firebaseConfig: firebaseConfigStatus,
        signInGoogle: signInGoogleHandler,
        registerEmail: registerEmailHandler,
        loginEmail: loginEmailHandler,
        sendReset: resetPassword,
        verifyEmail: resendVerificationEmail,
        logout: logoutHandler,
        redeemPromoCode: redeemPromoCodeHandler,
        refreshEntitlement: refreshEntitlementHandler,
        formatAuthError: formatFirebaseAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
