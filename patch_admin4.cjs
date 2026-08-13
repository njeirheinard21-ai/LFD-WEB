const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const newStates = `
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalActiveSubs, setTotalActiveSubs] = useState(0);
  const [subsCursor, setSubsCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [usersCursor, setUsersCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreSubs, setHasMoreSubs] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
`;

if (!code.includes('const [totalUsersCount')) {
  code = code.replace(/const \[isAssigning, setIsAssigning\] = useState\(false\);/, "const [isAssigning, setIsAssigning] = useState(false);\n" + newStates);
}

const newEffect = `
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
`;

if (!code.includes('const loadSubscriptions = async')) {
  const oldEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[user, authLoading, navigate, isAdmin\]\);/;
  code = code.replace(oldEffectRegex, newEffect);
}

fs.writeFileSync('src/pages/Admin.tsx', code);
