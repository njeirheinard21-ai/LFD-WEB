import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBg3g8XE8DpT_M0f0aaIbCNhC2CFz1G0es",
  authDomain: "lfd-service.firebaseapp.com",
  projectId: "lfd-service",
  storageBucket: "lfd-service.firebasestorage.app",
  messagingSenderId: "151104557438",
  appId: "1:151104557438:web:ceb85304a5e1190abbe32f",
  measurementId: "G-L82VRFTNFW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// TEMP debug code as requested
onAuthStateChanged(auth, (user) => {
  console.log("AUTH USER:", user);
});

// Initialize analytics only if window is defined (browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function getFriendlyErrorMessage(error: any): string {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      if (parsed.error) return getFriendlyErrorMessage(parsed.error);
    } catch {
      return error;
    }
  }

  const code = error?.code || error?.message || '';
  
  // Auth Errors
  if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please try again.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (code.includes('auth/requires-recent-login')) {
    return 'For security, please log out and log back in before performing this action.';
  }

  // Firestore Errors
  if (code.includes('permission-denied')) {
    return 'You do not have permission to perform this action.';
  }
  if (code.includes('unavailable')) {
    return 'The service is temporarily unavailable. Please check your connection.';
  }
  if (code.includes('deadline-exceeded')) {
    return 'The request timed out. Please try again.';
  }
  if (code.includes('quota-exceeded')) {
    return 'Service quota exceeded. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
}

export function handleAuthError(error: unknown) {
  const message = getFriendlyErrorMessage(error);
  console.error('Auth Error:', error);
  return message;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error:', JSON.stringify(errInfo));
  
  // Create a new error that includes the friendly message but keeps the JSON for debugging
  const friendlyMessage = getFriendlyErrorMessage(error);
  const errorWithMetadata = new Error(JSON.stringify(errInfo));
  (errorWithMetadata as any).friendlyMessage = friendlyMessage;
  
  throw errorWithMetadata;
}

