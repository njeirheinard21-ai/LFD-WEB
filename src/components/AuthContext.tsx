import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { mockBackend, User, Subscription } from '../lib/mockBackend';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let mappedUser: User = {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
        };

        const path = `users/${firebaseUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            mappedUser = {
              id: firebaseUser.uid,
              fullName: data.name || firebaseUser.displayName || 'User',
              email: data.email || firebaseUser.email || '',
              phone: data.phoneNumber || firebaseUser.phoneNumber || '',
              role: data.role || 'user',
            };
          }
        } catch (error) {
          console.error("Non-fatal error fetching user profile:", error);
          // We don't call handleFirestoreError here because it throws, which would crash the auth listener
          // and prevent the user from logging in at all.
        }

        setUser(mappedUser);
        
        // Real Firestore subscription check
        try {
          const q = query(
            collection(db, 'subscriptions'),
            where('userId', '==', firebaseUser.uid),
            where('status', '==', 'active')
          );
          const subSnap = await getDocs(q);
          if (!subSnap.empty) {
            const subDoc = subSnap.docs[0];
            const subData = subDoc.data();
            const expiryDate = new Date(subData.expiryDate);
            const now = new Date();

            if (now > expiryDate) {
              // Auto-expire the subscription
              console.log(">>> Subscription auto-expired for user:", firebaseUser.uid);
              try {
                await updateDoc(doc(db, 'subscriptions', subDoc.id), { status: 'expired' });
              } catch (updateErr) {
                console.error("Failed to auto-expire subscription in Firestore:", updateErr);
              }
              setSubscription(null);
            } else {
              setSubscription({
                userId: firebaseUser.uid,
                status: subData.status,
                planType: subData.planType,
                startDate: subData.startDate,
                expiryDate: subData.expiryDate
              });
            }
          } else {
            setSubscription(null);
          }
        } catch (subError) {
          console.error("Error fetching subscription:", subError);
          setSubscription(null);
        }
      } else {
        setUser(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshSubscription = async () => {
    if (user) {
      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('userId', '==', user.id),
          where('status', '==', 'active')
        );
        const subSnap = await getDocs(q);
        if (!subSnap.empty) {
          const subDoc = subSnap.docs[0];
          const subData = subDoc.data();
          const expiryDate = new Date(subData.expiryDate);
          const now = new Date();

          if (now > expiryDate) {
            console.log(">>> Subscription auto-expired during refresh for user:", user.id);
            try {
              await updateDoc(doc(db, 'subscriptions', subDoc.id), { status: 'expired' });
            } catch (updateErr) {
              console.error("Failed to auto-expire subscription in Firestore:", updateErr);
            }
            setSubscription(null);
          } else {
            setSubscription({
              userId: user.id,
              status: subData.status,
              planType: subData.planType,
              startDate: subData.startDate,
              expiryDate: subData.expiryDate
            });
          }
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error refreshing subscription:", error);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setSubscription(null);
  };

  const handleSetUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('userId', '==', newUser.id),
          where('status', '==', 'active')
        );
        const subSnap = await getDocs(q);
        if (!subSnap.empty) {
          const subData = subSnap.docs[0].data();
          setSubscription({
            userId: newUser.id,
            status: subData.status,
            planType: subData.planType,
            startDate: subData.startDate,
            expiryDate: subData.expiryDate
          });
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error setting user subscription:", error);
        setSubscription(null);
      }
    } else {
      setSubscription(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, subscription, loading, refreshSubscription, logout, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
