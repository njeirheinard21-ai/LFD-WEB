import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, updateDoc, doc, query, orderBy, onSnapshot, addDoc, deleteDoc, getDocs, where, setDoc, limit, startAfter, getCountFromServer, getAggregateFromServer, sum, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db, auth, handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { CheckCircle, AlertCircle, Clock, ShieldCheck, Search, X, Trash2, Users, UserPlus, ShieldAlert, Video, Radio, Settings, Activity, Globe, MessageSquare, Image as ImageIcon, VideoOff } from 'lucide-react';
import { PRICING, formatPrice } from '../lib/pricing';

interface Subscription {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  planType: 'weekly' | 'monthly' | 'yearly';
  amount: number;
  paymentMethod: 'momo' | 'om' | 'cash';
  status: 'pending' | 'active' | 'expired' | 'key_generated';
  createdAt: string;
  startDate?: string;
  expiryDate?: string;
  subscriptionKey?: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface LiveStream {
  isLive: boolean;
  streamUrl: string;
  title: string;
  description: string;
  startedAt: string;
  visibility: 'public' | 'subscribers';
  chatEnabled: boolean;
  thumbnailUrl: string;
}

interface PastSeminar {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  trainer: string;
  image: string;
  videoUrl: string;
  createdAt?: string;
}

export default function Admin() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pastSeminars, setPastSeminars] = useState<PastSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'roles' | 'streaming' | 'past-seminars'>('overview');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'expired' | 'key_generated'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingPastSeminarId, setDeletingPastSeminarId] = useState<string | null>(null);
  const [confirmAssignRole, setConfirmAssignRole] = useState(false);
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRoleType, setNewRoleType] = useState<'admin' | 'user'>('user');
  const [isAssigning, setIsAssigning] = useState(false);

  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalActiveSubs, setTotalActiveSubs] = useState(0);
  const [subsCursor, setSubsCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [usersCursor, setUsersCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreSubs, setHasMoreSubs] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  
  // Live Stream State
  const [liveStream, setLiveStream] = useState<LiveStream>({
    isLive: false,
    streamUrl: '',
    title: 'Live Health Seminar',
    description: 'Join our expert-led live seminar session.',
    startedAt: '',
    visibility: 'subscribers',
    chatEnabled: true,
    thumbnailUrl: ''
  });
  const [isUpdatingStream, setIsUpdatingStream] = useState(false);
  const [streamError, setStreamError] = useState('');
  const navigate = useNavigate();

  const isFirebaseAuthed = !!user;

  
  const PAGE_SIZE = 25;

  const fetchStats = async () => {
    try {
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      setTotalUsersCount(usersSnap.data().count);
      
      const activeSubsSnap = await getCountFromServer(query(collection(db, 'subscriptions'), where('status', '==', 'active')));
      setTotalActiveSubs(activeSubsSnap.data().count);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubscriptions = async (isLoadMore = false) => {
    try {
      let q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      if (isLoadMore && subsCursor) {
        q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'), startAfter(subsCursor), limit(PAGE_SIZE));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      
      if (isLoadMore) {
        setSubscriptions(prev => [...prev, ...docs]);
      } else {
        setSubscriptions(docs);
      }
      setSubsCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreSubs(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadUsers = async (isLoadMore = false) => {
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      if (isLoadMore && usersCursor) {
        q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(usersCursor), limit(PAGE_SIZE));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      
      if (isLoadMore) {
        setUsers(prev => [...prev, ...docs]);
      } else {
        setUsers(docs);
      }
      setUsersCursor(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreUsers(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      alert("Access denied. Admin privileges required.");
      navigate('/');
      return;
    }

    fetchStats();
    loadSubscriptions();
    loadUsers();

    // Real-time Data Listener for Live Stream
    const streamDocRef = doc(db, 'liveStream', 'current');
    const unsubscribeStream = onSnapshot(streamDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveStream(docSnap.data() as LiveStream);
      }
    }, (err) => {
      console.error(">>> fetchLiveStream FAILED:", err);
    });

    // Real-time Data Listener for Past Seminars
    const pastSeminarsQ = query(collection(db, 'pastSeminars'));
    const unsubscribePastSeminars = onSnapshot(pastSeminarsQ, (snapshot) => {
      const seminars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PastSeminar));
      // Sort in-memory
      seminars.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setPastSeminars(seminars);
    }, (err) => {
      console.error(">>> fetchPastSeminars FAILED:", err);
    });

    return () => {
      unsubscribeStream();
      unsubscribePastSeminars();
    };
  }, [user, authLoading, navigate, isAdmin]);


  const handleAssignRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleEmail) return;
    setConfirmAssignRole(true);
  };

  const executeAssignRole = async () => {
    if (!newRoleEmail) return;
    
    setIsAssigning(true);
    setConfirmAssignRole(false);
    try {
      // 1. Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newRoleEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert(`No user found with email: ${newRoleEmail}. Users must register first before roles can be assigned.`);
        setIsAssigning(false);
        return;
      }

      // 2. Update the first user found (emails should be unique)
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        role: newRoleType
      });

      alert(`Successfully assigned ${newRoleType} role to ${newRoleEmail}`);
      setNewRoleEmail('');
    } catch (err: unknown) {
      console.error(">>> assignRoleByEmail FAILED:", err);
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsAssigning(false);
    }
  };

  const updateLiveStream = async (updates?: Partial<LiveStream>) => {
    setIsUpdatingStream(true);
    setStreamError('');
    try {
      const streamDocRef = doc(db, 'liveStream', 'current');
      const dataToSave = updates ? { ...liveStream, ...updates } : liveStream;
      await setDoc(streamDocRef, dataToSave, { merge: true });
      if (!updates) {
        alert("Stream settings saved successfully!");
      }
    } catch (err: unknown) {
      console.error(">>> updateLiveStream FAILED:", err);
      setStreamError(getFriendlyErrorMessage(err));
    } finally {
      setIsUpdatingStream(false);
    }
  };

  const toggleLiveStatus = async () => {
    if (!liveStream.streamUrl && !liveStream.isLive) {
      setStreamError("Please provide a stream URL before going live.");
      return;
    }

    const newStatus = !liveStream.isLive;
    await updateLiveStream({
      isLive: newStatus,
      startedAt: newStatus ? new Date().toISOString() : liveStream.startedAt
    });
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const revokeRole = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin privileges from ${userEmail}?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'user'
      });
      alert(`Role revoked for ${userEmail}`);
    } catch (err: unknown) {
      console.error(">>> revokeRole FAILED:", err);
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const generateKey = (planType: 'weekly' | 'monthly' | 'yearly') => {
    const prefix = planType === 'weekly' ? 'WK' : planType === 'monthly' ? 'OPT' : 'HLT';
    const random = crypto.randomUUID().split('-')[0].toUpperCase();
    return `${prefix}-${random}`;
  };

  const calculateExpiry = (planType: 'weekly' | 'monthly' | 'yearly') => {
    const date = new Date();
    if (planType === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else if (planType === 'monthly') {
      date.setDate(date.getDate() + 30);
    } else {
      date.setDate(date.getDate() + 365);
    }
    return date;
  };

  const generateActivationKey = async (sub: Subscription) => {
    const key = generateKey(sub.planType);
    const durationDays = sub.planType === 'weekly' ? 7 : sub.planType === 'monthly' ? 30 : 365;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Key expires in 24h if unused

    const path = `activationKeys`;
    try {
      // 1. Create the activation key document
      await addDoc(collection(db, path), {
        subscriptionId: sub.id,
        userId: sub.userId || 'unknown',
        email: sub.email || 'unknown',
        plan: sub.planType || 'monthly',
        durationDays: durationDays,
        key: key,
        status: 'unused',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      // 2. Update the subscription document to show the key was generated
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'key_generated',
        subscriptionKey: key
      });

      alert(`Activation key generated: ${key}\n\nIt will expire in 24 hours if unused.`);
    } catch (err: unknown) {
      alert(getFriendlyErrorMessage(err));
      if ((err as { code?: string }).code !== 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch (e) {
          // Error already logged by handleFirestoreError
        }
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Key copied to clipboard!");
  };

  const activateSubscription = async (sub: Subscription) => {
    if (!window.confirm(`Are you sure you want to manually activate the subscription for ${sub.name}?`)) return;
    
    const expiry = calculateExpiry(sub.planType);
    const path = `subscriptions/${sub.id}`;
    
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'active',
        startDate: new Date().toISOString(),
        expiryDate: expiry.toISOString()
      });
      alert(`Subscription for ${sub.name} activated successfully!`);
    } catch (err: unknown) {
      console.error(">>> activateSubscription FAILED:", err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deactivateSubscription = async (sub: Subscription) => {
    if (!window.confirm(`Are you sure you want to deactivate the subscription for ${sub.name}?`)) return;
    
    const path = `subscriptions/${sub.id}`;
    try {
      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'expired'
      });
    } catch (err: unknown) {
      console.error(">>> deactivateSubscription FAILED:", err);
      if ((err as { code?: string }).code === 'permission-denied') {
        alert("You do not have permission to deactivate subscriptions.");
      } else {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const deleteSubscription = async (sub: Subscription) => {
    console.log(">>> Attempting to delete subscription:", sub.id, sub.name);
    const path = `subscriptions/${sub.id}`;
    try {
      // 1. Delete associated activation keys
      const keysPath = 'activationKeys';
      console.log(">>> Cleaning up activation keys for sub:", sub.id);
      const keysQ = query(collection(db, keysPath), where('subscriptionId', '==', sub.id));
      const keysSnapshot = await getDocs(keysQ);
      
      if (!keysSnapshot.empty) {
        console.log(`>>> Found ${keysSnapshot.size} keys to delete`);
        const deletePromises = keysSnapshot.docs.map(keyDoc => deleteDoc(doc(db, keysPath, keyDoc.id)));
        await Promise.all(deletePromises);
      }

      // 2. Delete the subscription itself
      console.log(">>> Deleting subscription document:", sub.id);
      await deleteDoc(doc(db, 'subscriptions', sub.id));
      
      setDeletingId(null);
      alert(`Subscription for ${sub.name} deleted successfully.`);
    } catch (err: unknown) {
      console.error(">>> deleteSubscription FAILED:", err);
      setDeletingId(null);
      if ((err as { code?: string }).code === 'permission-denied') {
        alert("You do not have permission to delete subscriptions.");
      } else {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const updateSubscriptionStatus = async (subId: string, newStatus: Subscription['status']) => {
    const path = `subscriptions/${subId}`;
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      // If moving to active, we should probably set expiry if not already set
      if (newStatus === 'active') {
        const sub = subscriptions.find(s => s.id === subId);
        if (sub && !sub.expiryDate) {
          const expiry = calculateExpiry(sub.planType);
          updateData.startDate = new Date().toISOString();
          updateData.expiryDate = expiry.toISOString();
        }
      }

      await updateDoc(doc(db, 'subscriptions', subId), updateData);
      alert(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      console.error(">>> updateSubscriptionStatus FAILED:", err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleCreatePastSeminar = async () => {
    try {
      await addDoc(collection(db, 'pastSeminars'), {
        title: 'New Seminar',
        category: 'General Health',
        description: 'Description of the seminar',
        duration: '1 Hour',
        trainer: 'Trainer Name',
        image: 'https://i.imgur.com/1u0MFk9.jpeg',
        videoUrl: '',
        createdAt: new Date().toISOString()
      });
      alert('Seminar created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create seminar');
    }
  };

  const handleUpdatePastSeminar = async (id: string, updates: Partial<PastSeminar>) => {
    try {
      await updateDoc(doc(db, 'pastSeminars', id), updates);
      alert('Seminar updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update seminar');
    }
  };

  const handleDeletePastSeminar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pastSeminars', id));
      setDeletingPastSeminarId(null);
    } catch (err: unknown) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'pastSeminars');
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-6 sm:mb-8 py-1 whitespace-nowrap scrollbar-hide space-x-2 sm:space-x-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'border-[#059669] text-[#059669]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'subscriptions' 
                ? 'border-[#059669] text-[#059669]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'roles' 
                ? 'border-[#059669] text-[#059669]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Role Management
          </button>
          <button
            onClick={() => setActiveTab('streaming')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'streaming' 
                ? 'border-[#059669] text-[#059669]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Streaming
          </button>
          <button
            onClick={() => setActiveTab('past-seminars')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'past-seminars' 
                ? 'border-[#059669] text-[#059669]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Seminars
          </button>
        </div>
        
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-7 w-7 sm:h-8 sm:w-8 text-[#059669]" />
                  Enterprise Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Real-time platform analytics and system health.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{users.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium flex items-center"><Activity className="h-4 w-4 mr-1" /> +12%</span>
                  <span className="text-gray-400 ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{subscriptions.filter(s => s.status === 'active').length}</h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium flex items-center"><Activity className="h-4 w-4 mr-1" /> +8%</span>
                  <span className="text-gray-400 ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">
                      {formatPrice(subscriptions.filter(s => s.status === 'active' || s.status === 'key_generated').reduce((acc, curr) => acc + (PRICING[curr.planType]?.amount || curr.amount || 0), 0))}
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium flex items-center"><Activity className="h-4 w-4 mr-1" /> +15%</span>
                  <span className="text-gray-400 ml-2">from last month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Past Seminars</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{pastSeminars.length}</h3>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <Video className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium flex items-center"><Activity className="h-4 w-4 mr-1" /> +2</span>
                  <span className="text-gray-400 ml-2">this week</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Jan', revenue: 4000 },
                      { name: 'Feb', revenue: 3000 },
                      { name: 'Mar', revenue: 2000 },
                      { name: 'Apr', revenue: 2780 },
                      { name: 'May', revenue: 1890 },
                      { name: 'Jun', revenue: 2390 },
                      { name: 'Jul', revenue: 3490 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Subscription Plans</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Weekly', count: subscriptions.filter(s => s.planType === 'weekly').length },
                      { name: 'Monthly', count: subscriptions.filter(s => s.planType === 'monthly').length },
                      { name: 'Yearly', count: subscriptions.filter(s => s.planType === 'yearly').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'subscriptions' ? (
          <>
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-[#059669]" />
                  Admin Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage user subscriptions and access keys.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 lg:mt-0 w-full lg:w-auto">
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <div className={`relative flex items-center transition-all duration-300 ${isSearchExpanded ? 'flex-grow sm:w-64' : 'w-10'}`}>
                    {isSearchExpanded ? (
                      <>
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                          className="w-full pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none shadow-sm text-sm"
                        />
                        <button 
                          onClick={() => {
                            setIsSearchExpanded(false);
                            setSearchTerm('');
                          }}
                          className="absolute right-3 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsSearchExpanded(true)}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                        title="Search"
                      >
                        <Search className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      auth.signOut();
                      navigate('/admin-login');
                    }}
                    className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors whitespace-nowrap px-2"
                  >
                    Logout
                  </button>
                </div>

                {/* Filters - Scrollable on Mobile */}
                <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm min-w-max">
                    <button 
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${filter === 'all' ? 'bg-[#059669] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${filter === 'pending' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => setFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${filter === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => setFilter('key_generated')}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${filter === 'key_generated' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Keys
                    </button>
                    <button 
                      onClick={() => setFilter('expired')}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${filter === 'expired' ? 'bg-gray-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Expired
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading || authLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop/Tablet Table View */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredSubs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                              No subscriptions found.
                            </td>
                          </tr>
                        ) : (
                          filteredSubs.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{sub.name}</div>
                                <div className="text-sm text-gray-500">{sub.email}</div>
                                <div className="text-xs text-gray-400">{sub.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                                  sub.planType === 'yearly' ? 'bg-purple-100 text-purple-800' : sub.planType === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {sub.planType}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">{formatPrice(PRICING[sub.planType]?.amount || sub.amount)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  sub.paymentMethod === 'momo' ? 'bg-yellow-100 text-yellow-800' : 
                                  sub.paymentMethod === 'om' ? 'bg-orange-100 text-orange-800' : 
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {sub.paymentMethod}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={sub.status}
                                  onChange={(e) => updateSubscriptionStatus(sub.id, e.target.value as Subscription['status'])}
                                  className={`text-sm font-bold rounded-lg px-2 py-1 outline-none border transition-colors ${
                                    sub.status === 'active' ? 'text-green-600 border-green-100 bg-green-50' :
                                    sub.status === 'pending' ? 'text-orange-500 border-orange-100 bg-orange-50' :
                                    sub.status === 'key_generated' ? 'text-indigo-500 border-indigo-100 bg-indigo-50' :
                                    'text-gray-400 border-gray-100 bg-gray-50'
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="active">Active</option>
                                  <option value="key_generated">Key Generated</option>
                                  <option value="expired">Expired</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {new Date(sub.createdAt).toLocaleDateString()}
                                </div>
                                {sub.expiryDate && (
                                  <div className="text-xs text-gray-500">
                                    Exp: {new Date(sub.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end gap-2">
                                  {sub.status === 'pending' && (
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                      <button 
                                        onClick={() => activateSubscription(sub)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm text-center"
                                      >
                                        Activate
                                      </button>
                                      <button 
                                        onClick={() => generateActivationKey(sub)}
                                        className="bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#047857] transition-all shadow-sm text-center"
                                      >
                                        Generate Key
                                      </button>
                                    </div>
                                  )}
                                  {sub.status === 'key_generated' && (
                                    <>
                                      <div className="text-xs font-mono bg-gray-100 p-1.5 rounded border border-gray-200 inline-block">
                                        {sub.subscriptionKey}
                                      </div>
                                      <div className="flex gap-2 mt-1 w-full sm:w-auto">
                                        <button 
                                          onClick={() => activateSubscription(sub)}
                                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm flex-1"
                                        >
                                          Activate
                                        </button>
                                        <button 
                                          onClick={() => copyToClipboard(sub.subscriptionKey || '')}
                                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all border border-gray-300 flex-1"
                                        >
                                          Copy Key
                                        </button>
                                      </div>
                                    </>
                                  )}
                                  {sub.status === 'active' && (
                                    <>
                                      <div className="text-xs font-mono bg-gray-100 p-1.5 rounded border border-gray-200 inline-block">
                                        {sub.subscriptionKey || 'Activated Manually'}
                                      </div>
                                      <button 
                                        onClick={() => deactivateSubscription(sub)}
                                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-all border border-red-200 w-full sm:w-auto text-center mt-1"
                                      >
                                        Deactivate
                                      </button>
                                    </>
                                  )}
                                  {sub.status === 'expired' && (
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                      <button 
                                        onClick={() => activateSubscription(sub)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm text-center"
                                      >
                                        Re-activate
                                      </button>
                                      <button 
                                        onClick={() => generateActivationKey(sub)}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all border border-gray-300 text-center"
                                      >
                                        Generate New Key
                                      </button>
                                    </div>
                                  )}
                                  {deletingId === sub.id ? (
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => deleteSubscription(sub)}
                                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                                      >
                                        Confirm Delete
                                      </button>
                                      <button 
                                        onClick={() => setDeletingId(null)}
                                        className="text-gray-500 text-xs hover:underline"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setDeletingId(sub.id)}
                                      className="text-red-400 hover:text-red-600 p-1 transition-colors flex items-center gap-1"
                                      title="Delete Subscription"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="text-xs">Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredSubs.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-500">
                      No subscriptions found.
                    </div>
                  ) : (
                    filteredSubs.map((sub) => (
                      <div key={sub.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900 text-lg">{sub.name}</div>
                            <div className="text-sm text-gray-500">{sub.email}</div>
                            <div className="text-xs text-gray-400">{sub.phone}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <select
                              value={sub.status}
                              onChange={(e) => updateSubscriptionStatus(sub.id, e.target.value as Subscription['status'])}
                              className={`text-xs font-bold rounded-lg px-2 py-1 outline-none border transition-colors ${
                                sub.status === 'active' ? 'text-green-600 border-green-100 bg-green-50' :
                                sub.status === 'pending' ? 'text-orange-500 border-orange-100 bg-orange-50' :
                                sub.status === 'key_generated' ? 'text-indigo-500 border-indigo-100 bg-indigo-50' :
                                'text-gray-400 border-gray-100 bg-gray-50'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="key_generated">Key Generated</option>
                              <option value="expired">Expired</option>
                            </select>
                            {deletingId === sub.id ? (
                              <div className="flex flex-col items-end gap-1">
                                <button 
                                  onClick={() => deleteSubscription(sub)}
                                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                                >
                                  Confirm Delete
                                </button>
                                <button 
                                  onClick={() => setDeletingId(null)}
                                  className="text-gray-500 text-[10px] underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeletingId(sub.id)}
                                className="text-red-400 hover:text-red-600 p-1 flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-[10px]">Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Plan</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              sub.planType === 'yearly' ? 'bg-purple-100 text-purple-800' : sub.planType === 'monthly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {sub.planType}
                            </span>
                            <div className="text-xs text-gray-900 font-bold mt-1">{formatPrice(PRICING[sub.planType]?.amount || sub.amount)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Payment</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sub.paymentMethod === 'momo' ? 'bg-yellow-100 text-yellow-800' : 
                              sub.paymentMethod === 'om' ? 'bg-orange-100 text-orange-800' : 
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {sub.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="text-gray-500">
                            Joined: {new Date(sub.createdAt).toLocaleDateString()}
                          </div>
                          {sub.expiryDate && (
                            <div className="text-gray-900 font-medium">
                              Exp: {new Date(sub.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          {sub.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => activateSubscription(sub)}
                                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                              >
                                Activate
                              </button>
                              <button 
                                onClick={() => generateActivationKey(sub)}
                                className="bg-[#059669] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#047857] transition-all shadow-sm"
                              >
                                Generate Key
                              </button>
                            </div>
                          )}
                          {sub.status === 'key_generated' && (
                            <div className="space-y-3">
                              <div className="text-xs font-mono bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-center break-all">
                                {sub.subscriptionKey}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => activateSubscription(sub)}
                                  className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                                >
                                  Activate
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(sub.subscriptionKey || '')}
                                  className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200"
                                >
                                  Copy Key
                                </button>
                              </div>
                            </div>
                          )}
                          {sub.status === 'active' && (
                            <div className="space-y-3">
                              <div className="text-xs font-mono bg-green-50 text-green-700 p-2.5 rounded-xl border border-green-100 text-center">
                                {sub.subscriptionKey || 'Activated Manually'}
                              </div>
                              <button 
                                onClick={() => deactivateSubscription(sub)}
                                className="w-full bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-100"
                              >
                                Deactivate Subscription
                              </button>
                            </div>
                          )}
                          {sub.status === 'expired' && (
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => activateSubscription(sub)}
                                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                              >
                                Re-activate
                              </button>
                              <button 
                                onClick={() => generateActivationKey(sub)}
                                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200"
                              >
                                New Key
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {hasMoreSubs && filteredSubs.length > 0 && filter === 'all' && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => loadSubscriptions(true)}
                      className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : activeTab === 'roles' ? (
          <div className="space-y-8">
            {/* Assign Role Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#059669]" />
                Assign New Role
              </h2>
              <form onSubmit={handleAssignRoleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <input
                    type="email"
                    placeholder="User Email"
                    value={newRoleEmail}
                    onChange={(e) => setNewRoleEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <select
                    value={newRoleType}
                    onChange={(e) => setNewRoleType(e.target.value as 'admin' | 'user')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none font-bold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {confirmAssignRole ? (
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <button
                      type="button"
                      onClick={executeAssignRole}
                      className="bg-red-600 text-white px-4 py-1 rounded-lg text-xs font-bold hover:bg-red-700 w-full"
                    >
                      Confirm Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAssignRole(false)}
                      className="text-gray-500 text-xs hover:underline w-full"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="bg-[#059669] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#047857] transition-all shadow-sm disabled:opacity-50"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Role'}
                  </button>
                )}
              </form>
              <p className="text-xs text-gray-500 mt-3">
                Note: Users must have an existing account before you can assign them a role.
              </p>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#059669]" />
                  User Roles
                </h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {users.length} Total
                </span>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.role === 'admin' && (
                            <button
                              onClick={() => revokeRole(u.id, u.email)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 ml-auto"
                            >
                              <ShieldAlert className="h-4 w-4" />
                              Revoke Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-50">
                {users.map((u) => (
                  <div key={u.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{u.name || 'No Name'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-50">
                      <div>Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</div>
                      {u.role === 'admin' && (
                        <button
                          onClick={() => revokeRole(u.id, u.email)}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMoreUsers && users.length > 0 && (
                <div className="px-5 sm:px-6 py-4 border-t border-gray-50 flex justify-center">
                  <button
                    onClick={() => loadUsers(true)}
                    className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'streaming' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Live Stream Control Panel */}
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
              
              {/* Left Column: Stream Settings */}
              <div className="flex-grow space-y-6">
                <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 p-5 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-50 rounded-2xl">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Stream Settings</h2>
                  </div>
                  {/* ... (rest of streaming form) ... */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Stream Title</label>
                      <input 
                        type="text"
                        value={liveStream.title}
                        onChange={(e) => setLiveStream({ ...liveStream, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        placeholder="Enter stream title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                      <textarea 
                        rows={4}
                        value={liveStream.description}
                        onChange={(e) => setLiveStream({ ...liveStream, description: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                        placeholder="What is this seminar about?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail URL</label>
                      <input 
                        type="text"
                        value={liveStream.thumbnailUrl || ''}
                        onChange={(e) => setLiveStream({ ...liveStream, thumbnailUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Visibility</label>
                        <select 
                          value={liveStream.visibility}
                          onChange={(e) => setLiveStream({ ...liveStream, visibility: e.target.value as 'public' | 'subscribers' })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        >
                          <option value="public">Public (Everyone)</option>
                          <option value="subscribers">Subscribers Only</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">Enable Chat</span>
                        </div>
                        <button 
                          onClick={() => setLiveStream({ ...liveStream, chatEnabled: !liveStream.chatEnabled })}
                          className={`w-12 h-6 rounded-full transition-all relative ${liveStream.chatEnabled ? 'bg-[#059669]' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${liveStream.chatEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => updateLiveStream()}
                        disabled={isUpdatingStream}
                        className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50"
                      >
                        {isUpdatingStream ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 p-5 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Stream Source</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">YouTube Video URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={liveStream.streamUrl}
                          onChange={(e) => setLiveStream({ ...liveStream, streamUrl: e.target.value })}
                          className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Paste the full YouTube URL or the video ID. We'll automatically convert it to an embed.
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => updateLiveStream()}
                        disabled={isUpdatingStream}
                        className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                      >
                        {isUpdatingStream ? 'Saving...' : 'Save Source'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Preview & Status */}
              <div className="w-full lg:w-[400px] space-y-6">
                {/* Status Panel */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Stream Status</h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      liveStream.isLive ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${liveStream.isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`} />
                      {liveStream.isLive ? 'Live' : 'Offline'}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Activity className="h-4 w-4" />
                        <span>Health</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">Excellent</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Started At</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {liveStream.startedAt ? new Date(liveStream.startedAt).toLocaleTimeString() : '--:--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Users className="h-4 w-4" />
                        <span>Viewers</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{liveStream.isLive ? '124' : '0'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={toggleLiveStatus}
                    disabled={isUpdatingStream}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                      liveStream.isLive 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                        : 'bg-[#059669] hover:bg-[#047857] shadow-green-100'
                    }`}
                  >
                    {liveStream.isLive ? (
                      <>
                        <Radio className="h-5 w-5" /> End Stream
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5" /> Go Live Now
                      </>
                    )}
                  </button>

                  {streamError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {streamError}
                    </div>
                  )}
                </div>

                {/* Preview Window */}
                <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 px-2 sm:px-4 pt-2">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-700">Live Preview</h3>
                  </div>
                  <div className="aspect-video bg-gray-900 rounded-xl sm:rounded-[1.5rem] overflow-hidden flex items-center justify-center relative group">
                    {liveStream.streamUrl && getYouTubeId(liveStream.streamUrl) ? (
                      <iframe 
                        width="100%" 
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYouTubeId(liveStream.streamUrl)}?autoplay=0&mute=1&rel=0&modestbranding=1`}
                        title="Stream Preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="text-center p-8">
                        <Video className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 text-xs">No stream URL provided</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Admin Preview Only</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'past-seminars' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Video className="h-6 w-6 text-[#059669]" /> Manage Past Seminars
                </h2>
                <p className="text-gray-500 text-sm mt-1">Add or edit recorded videos in the library.</p>
              </div>
              <button
                onClick={handleCreatePastSeminar}
                className="bg-[#059669] text-white w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl font-bold hover:bg-[#047857] transition-all flex items-center gap-2 shadow-sm"
              >
                + Add Seminar
              </button>
            </div>
            
            {pastSeminars.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <VideoOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">No Past Seminars</h3>
                <p className="text-gray-500 mt-1">Click "Add Seminar" to curate your library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {pastSeminars.map((seminar) => (
                  <form 
                    key={seminar.id} 
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm relative overflow-hidden group"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      let videoUrlRaw = formData.get('videoUrl') as string;
                      const extractedId = getYouTubeId(videoUrlRaw);
                      if (extractedId) {
                        videoUrlRaw = `https://www.youtube.com/watch?v=${extractedId}`;
                      }

                      const updates = {
                        title: formData.get('title') as string,
                        category: formData.get('category') as string,
                        duration: formData.get('duration') as string,
                        trainer: formData.get('trainer') as string,
                        description: formData.get('description') as string,
                        videoUrl: videoUrlRaw,
                        image: formData.get('image') as string,
                        updatedAt: new Date().toISOString()
                      };
                      handleUpdatePastSeminar(seminar.id, updates);
                    }}
                  >
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <button
                        type="submit"
                        className="bg-[#059669] text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-[#047857] transition-colors"
                      >
                        Save
                      </button>
                      {deletingPastSeminarId === seminar.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeletePastSeminar(seminar.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPastSeminarId(null)}
                            className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingPastSeminarId(seminar.id)}
                          className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete Seminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-rows-auto gap-4 mt-12 sm:mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                          <input 
                            type="text" 
                            name="title"
                            defaultValue={seminar.title}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                          <input 
                            type="text" 
                            name="category"
                            defaultValue={seminar.category}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Duration</label>
                          <input 
                            type="text" 
                            name="duration"
                            defaultValue={seminar.duration}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Trainer Name</label>
                          <input 
                            type="text" 
                            name="trainer"
                            defaultValue={seminar.trainer}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                        <textarea 
                          rows={2}
                          name="description"
                          defaultValue={seminar.description}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-red-600 mb-1">
                          <Video className="w-3 h-3" /> YouTube Video URL
                        </label>
                        <input 
                          type="text" 
                          name="videoUrl"
                          defaultValue={seminar.videoUrl}
                          placeholder="e.g. https://www.youtube.com/watch?v=..."
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-800 placeholder-red-300 focus:ring-2 focus:ring-red-400 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
                          <ImageIcon className="w-3 h-3" /> Cover Image URL
                        </label>
                        <input 
                          type="text" 
                          name="image"
                          defaultValue={seminar.image}
                          className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-800 placeholder-purple-300 focus:ring-2 focus:ring-purple-400 outline-none"
                        />
                      </div>

                    </div>
                  </form>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
