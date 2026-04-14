import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled';

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: string;
  subscriptionStatus: SubscriptionStatus;
}

export interface Subscription {
  id?: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  createdAt: string;
  key: string;
}

export interface Payment {
  id?: string;
  userId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
}

// Helper to handle Firestore errors
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth Functions
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const logoutUser = async () => {
  await signOut(auth);
};

// Firestore Functions
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
};

export const createUserProfile = async (uid: string, email: string) => {
  try {
    const userProfile: UserProfile = {
      uid,
      email,
      createdAt: new Date().toISOString(),
      subscriptionStatus: 'none'
    };
    await setDoc(doc(db, 'users', uid), userProfile);
    return userProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
  }
};

export const getUserSubscription = async (uid: string): Promise<Subscription | null> => {
  try {
    const q = query(collection(db, 'subscriptions'), where('userId', '==', uid), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Subscription;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subscriptions');
    return null;
  }
};

// Mock Cloud Function Logic for Processing Subscription
export const processSubscription = async (uid: string, planId: string, amount: number) => {
  try {
    // 1. Create Payment Record
    const payment: Payment = {
      userId: uid,
      amount,
      status: 'success',
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'payments'), payment);

    // 2. Create Subscription Record
    const key = `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const subscription: Subscription = {
      userId: uid,
      planId,
      status: 'active',
      createdAt: new Date().toISOString(),
      key
    };
    await addDoc(collection(db, 'subscriptions'), subscription);

    // 3. Update User Profile
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      await setDoc(userRef, { ...userData, subscriptionStatus: 'active' });
    }

    return { success: true, key };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'multiple');
    return { success: false, error };
  }
};
