import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle, Star, ChevronDown, ChevronUp, Shield, Award, Lock, PlayCircle, X, Smartphone, VideoOff, Radio, AlertCircle, ArrowRight, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { addDoc, collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../lib/firebase';
import { PricingSection } from '../components/PricingSection';

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

export default function Seminars() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, subscription, loading } = useAuth();
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [modalStep, setModalStep] = useState<'form' | 'instructions' | 'key'>('form');
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', paymentMethod: 'momo' });
  const [subKey, setSubKey] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current?.requestFullscreen) {
        await videoContainerRef.current.requestFullscreen();
        try {
          const orientation = screen.orientation as any;
          if (orientation && orientation.lock) {
            await orientation.lock('landscape');
          }
        } catch (err) {
          console.log('Orientation lock failed', err);
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (err) {
          console.log('Orientation unlock failed', err);
        }
      }
    }
  };

  useEffect(() => {
    // Prevent right-clicking globally on this page
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    // Real-time Data Listener for Live Stream
    const streamDocRef = doc(db, 'liveStream', 'current');
    const unsubscribeStream = onSnapshot(streamDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveStream(docSnap.data() as LiveStream);
      } else {
        setLiveStream(null);
      }
    }, (err) => {
      console.error(">>> fetchLiveStream FAILED:", err);
    });

    return () => unsubscribeStream();
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const seminars = [
    {
      id: 1,
      title: 'Diabetes Management Masterclass',
      category: 'Chronic Disease Management',
      description: 'Learn comprehensive strategies to manage blood sugar levels through diet, exercise, and medication.',
      duration: '2 Hours',
      trainer: 'Dr. Sarah Jenkins',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
    },
    {
      id: 2,
      title: 'Heart Health & Nutrition',
      category: 'Nutrition & Lifestyle',
      description: 'Discover the best dietary practices and lifestyle changes to maintain optimal cardiovascular health.',
      duration: '1.5 Hours',
      trainer: 'Dr. Michael Chang',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 3,
      title: 'Stress & Anxiety Relief Workshop',
      category: 'Mental Health & Wellness',
      description: 'Practical techniques and mindfulness exercises to effectively manage daily stress and anxiety.',
      duration: '3 Hours',
      trainer: 'Dr. Emily Rodriguez',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 4,
      title: 'Preventive Healthcare Basics',
      category: 'Preventive Healthcare',
      description: 'Understand the fundamentals of preventive care, screenings, and early detection of common illnesses.',
      duration: '1 Hour',
      trainer: 'Dr. James Wilson',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  ];

  const faqs = [
    {
      question: 'How does the subscription work?',
      answer: 'Once you subscribe to any of our plans (Weekly, Monthly, or Yearly), you get unlimited access to all our premium health seminars and training videos for the duration of your subscription.'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel your subscription at any time from your dashboard. You will continue to have access until the end of your current billing cycle.'
    },
    {
      question: 'Are new seminars added regularly?',
      answer: 'Yes! We add new masterclasses and workshops every month, covering the latest in health, nutrition, and preventive care.'
    }
  ];

  const handleSubscribe = (plan: 'weekly' | 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setModalStep('form');
    setFormData({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      paymentMethod: 'momo'
    });
    setModalError('');
    setSubKey('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(">>> handleFormSubmit started");
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log(">>> User not logged in (auth.currentUser is null)");
      alert("Please login first");
      navigate('/login');
      return;
    }

    // Input Validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      console.log(">>> Validation failed: missing fields", formData);
      setModalError("Please fill in all required fields.");
      return;
    }

    setModalError('');
    setIsSubmitting(true);
    const path = 'subscriptions';
    
    try {
      await addDoc(collection(db, path), {
        userId: currentUser.uid,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        planType: selectedPlan,
        amount: selectedPlan === 'weekly' ? 5000 : selectedPlan === 'monthly' ? 15000 : 100000,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setModalStep('instructions');
    } catch (error: any) {
      console.error("Subscription submission error:", error);
      setModalError(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!subKey) {
      setModalError("Please enter your subscription key.");
      return;
    }

    setModalError('');
    setIsSubmitting(true);
    
    const path = 'activationKeys';
    try {
      // 1. Query activationKeys
      const keyQuery = query(
        collection(db, 'activationKeys'),
        where('key', '==', subKey.toUpperCase()),
        where('userId', '==', user.id),
        where('status', '==', 'unused')
      );
      
      const keySnapshot = await getDocs(keyQuery);
      
      if (keySnapshot.empty) {
        setModalError('Invalid or already used key.');
        return;
      }

      const keyDoc = keySnapshot.docs[0];
      const keyData = keyDoc.data();
      
      // 2. Check if key is expired (24h)
      if (new Date() > new Date(keyData.expiresAt)) {
        setModalError('This activation key has expired. Please request a new one.');
        return;
      }

      // 3. Query the corresponding subscription
      const subQuery = query(
        collection(db, 'subscriptions'),
        where('subscriptionKey', '==', subKey.toUpperCase()),
        where('userId', '==', user.id)
      );
      const subSnapshot = await getDocs(subQuery);

      if (subSnapshot.empty) {
        setModalError('Subscription record not found.');
        return;
      }

      const subDoc = subSnapshot.docs[0];

      // 4. Calculate dates
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + keyData.durationDays);

      // 5. Update activationKey to used
      await updateDoc(doc(db, 'activationKeys', keyDoc.id), {
        status: 'used'
      });

      // 6. Update subscription to active
      await updateDoc(doc(db, 'subscriptions', subDoc.id), {
        status: 'active',
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString()
      });

      localStorage.setItem('hasLiveAccess', 'true');
      setIsModalOpen(false);
      navigate('/live-seminars');
      
    } catch (err: any) {
      console.error("Key activation error:", err);
      setModalError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
      </div>
    );
  }

  const hasAccess = user && (subscription?.status === 'active' || user.email?.toLowerCase() === 'njeirheinard21@gmail.com');

  return (
    <div className="bg-white relative">
      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-8">
                {modalStep === 'form' ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Subscription</h2>
                    <p className="text-gray-600 mb-6">
                      You selected the <span className="font-bold capitalize text-[#059669]">{selectedPlan}</span> plan.
                    </p>

                    {modalError && (
                      <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
                        {modalError}
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                          placeholder="+237 6XX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentMethod: 'momo' })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                              formData.paymentMethod === 'momo' 
                                ? 'border-yellow-400 bg-yellow-50' 
                                : 'border-gray-200 hover:border-yellow-200'
                            }`}
                          >
                            <Smartphone className={`h-6 w-6 mb-1 ${formData.paymentMethod === 'momo' ? 'text-yellow-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${formData.paymentMethod === 'momo' ? 'text-yellow-700' : 'text-gray-500'}`}>MTN MoMo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentMethod: 'om' })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                              formData.paymentMethod === 'om' 
                                ? 'border-orange-400 bg-orange-50' 
                                : 'border-gray-200 hover:border-orange-200'
                            }`}
                          >
                            <Smartphone className={`h-6 w-6 mb-1 ${formData.paymentMethod === 'om' ? 'text-orange-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${formData.paymentMethod === 'om' ? 'text-orange-700' : 'text-gray-500'}`}>Orange Money</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 py-3.5 rounded-xl font-bold text-white bg-[#059669] hover:bg-[#047857] transition-colors shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? 'Processing...' : 'Submit Subscription'}
                      </button>
                    </form>
                  </>
                ) : modalStep === 'instructions' ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Smartphone className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Instructions</h2>
                      <p className="text-gray-600">
                        Please follow the steps below to complete your payment.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                      <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-bold">Send {selectedPlan === 'weekly' ? '5,000 XAF' : selectedPlan === 'monthly' ? '15,000 XAF' : '100,000 XAF'} to:</p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                          <span className="font-bold text-yellow-600">MTN MoMo</span>
                          <span className="font-mono font-bold">+237 6XX XXX XXX</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                          <span className="font-bold text-orange-600">Orange Money</span>
                          <span className="font-mono font-bold">+237 6XX XXX XXX</span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800 font-medium">
                          <span className="font-bold">Important:</span> Use your email (<span className="font-bold">{user?.email}</span>) as the payment reference.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setModalStep('key')}
                      className="w-full py-3.5 rounded-xl font-bold text-white bg-[#059669] hover:bg-[#047857] transition-colors shadow-lg"
                    >
                      I have paid, enter key
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full mt-3 py-3.5 rounded-xl font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Close and pay later
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Subscription Key</h2>
                      <p className="text-gray-600">
                        Please enter the key sent to your phone/email to activate live access.
                      </p>
                    </div>

                    {modalError && (
                      <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-xl text-sm text-center">
                        {modalError}
                      </div>
                    )}

                    <form onSubmit={handleKeySubmit} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          required
                          value={subKey}
                          onChange={(e) => setSubKey(e.target.value)}
                          className="w-full px-4 py-4 text-center text-lg tracking-widest font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none transition-all uppercase"
                          placeholder="XXXX-XXXX-XXXX"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-[#059669] hover:bg-[#047857] transition-colors shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? 'Activating...' : 'Activate Access'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStep('instructions')}
                        className="w-full py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Back to instructions
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="bg-purple-50 py-20 lg:py-32 text-center border-b border-purple-100 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[clamp(2.5rem,4vw,4rem)] font-bold mb-6 leading-tight">
            <span className="text-[#059669]">Psycho-Energetic</span> <span className="text-[#8B5CF6]">Seminar</span>
          </h1>
          <p className="text-gray-600 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
            Get unlimited access to expert-led masterclasses on chronic disease management, nutrition, and preventive healthcare.
          </p>
          
          {!hasAccess && (
            <a 
              href="#pricing" 
              className="inline-flex justify-center items-center bg-[#059669] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl min-h-[44px]"
            >
              View Subscription Plans
            </a>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-wrap justify-center gap-6 text-sm md:text-base font-medium text-gray-600"
          >
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#059669]" /> Certified Instructors</div>
            <div className="flex items-center gap-2"><Award className="h-5 w-5 text-[#059669]" /> Exclusive Content</div>
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Watch Anytime</div>
          </motion.div>
        </div>
      </section>

      {/* Access Control / Seminars Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {hasAccess ? (
            <>
              {/* LIVE STREAM SECTION */}
              <div className="mb-16">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Live Seminar Session</h2>
                    <p className="text-gray-600 mt-2">Welcome to your exclusive live seminar access.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-green-50 text-green-700 border border-green-100">
                      <Shield className="h-4 w-4" /> Subscription Active
                    </span>
                  </div>
                </div>

                {liveStream?.isLive ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                        <div className="aspect-video bg-gray-900 rounded-[1.5rem] flex flex-col items-center justify-center relative overflow-hidden">
                          {/* Live badge removed as requested */}
                          {getYouTubeId(liveStream.streamUrl) ? (
                            <div 
                              ref={videoContainerRef}
                              className="relative w-full h-full video-container select-none bg-black group" 
                              onContextMenu={(e) => e.preventDefault()}
                              onMouseMove={resetControlsTimeout}
                              onTouchStart={resetControlsTimeout}
                              onMouseEnter={() => setShowControls(true)}
                              onMouseLeave={() => setShowControls(false)}
                            >
                              {/* Top overlay to block title, share, and watch later */}
                              <div 
                                className="absolute top-0 left-0 w-full h-[15%] sm:h-[100px] z-20 bg-transparent cursor-default" 
                                onContextMenu={(e) => e.preventDefault()}
                              />
                              {/* Bottom-left overlay to block 'Watch on YouTube' and 'Copy link' */}
                              <div 
                                className="absolute bottom-0 left-0 w-[60%] sm:w-[350px] h-[25%] sm:h-[100px] z-20 bg-transparent cursor-default" 
                                onContextMenu={(e) => e.preventDefault()}
                              />
                              {/* Bottom-right overlay to block YouTube logo */}
                              <div 
                                className="absolute bottom-0 right-0 w-[30%] sm:w-[150px] h-[20%] sm:h-[80px] z-20 bg-transparent cursor-default" 
                                onContextMenu={(e) => e.preventDefault()}
                              />
                              <iframe 
                                width="100%" 
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYouTubeId(liveStream.streamUrl)}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1&disablekb=1&fs=1`} 
                                title={liveStream.title}
                                className="w-full h-full pointer-events-auto"
                                frameBorder="0"
                                sandbox="allow-scripts allow-same-origin allow-presentation"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              ></iframe>
                              
                              <AnimatePresence>
                                {showControls && (
                                  <motion.button 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onClick={toggleFullscreen} 
                                    className="absolute bottom-14 right-4 z-30 bg-black/60 text-white p-1.5 rounded-md hover:bg-black/80 transition-all backdrop-blur-md border-none shadow-lg"
                                    aria-label="Toggle Fullscreen"
                                  >
                                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                  </motion.button>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="text-center p-12">
                              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                              <p className="text-white font-bold">Invalid Stream URL</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-[#059669]" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{liveStream.title}</h2>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                              Started {new Date(liveStream.startedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {liveStream.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 h-[600px] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live Community Chat
                          </h3>
                        </div>
                        
                        {liveStream.chatEnabled ? (
                          <>
                            <div className="flex-grow p-6 flex flex-col items-center justify-center text-center bg-white">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-gray-300" />
                              </div>
                              <p className="text-gray-500 font-medium">Chat is currently in read-only mode</p>
                              <p className="text-gray-400 text-sm mt-1">The moderator will enable messaging shortly.</p>
                            </div>
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                              <div className="relative">
                                <input 
                                  type="text" 
                                  disabled
                                  placeholder="Type your question..." 
                                  className="w-full pl-4 pr-12 py-4 bg-white border border-gray-200 rounded-2xl cursor-not-allowed text-sm font-medium"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  <ArrowRight className="h-5 w-5 text-gray-300" />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <Radio className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-bold">Chat Disabled</p>
                            <p className="text-gray-400 text-sm mt-1">The host has disabled live chat for this session.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-12 md:p-20 text-center max-w-3xl mx-auto animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                      <VideoOff className="h-12 w-12 text-gray-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">No Live Seminar Running</h2>
                    <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                      There are currently no live sessions in progress. Check the schedule or your email for upcoming seminar announcements.
                    </p>
                    <a 
                      href="#past-seminars"
                      className="inline-flex items-center gap-2 bg-[#059669] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#047857] transition-all shadow-lg"
                    >
                      Browse Past Seminars <ArrowRight className="h-5 w-5" />
                    </a>
                  </div>
                )}
              </div>

              {/* PAST SEMINARS SECTION */}
              <div id="past-seminars" className="mb-12 flex justify-between items-end pt-12 border-t border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Past Seminars Library</h2>
                  <p className="text-gray-600">You have full access to all premium recorded content.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {seminars.map((seminar, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    key={seminar.id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col"
                  >
                    <div className="relative h-64 bg-gray-900 group cursor-pointer">
                      <img src={seminar.image} alt={seminar.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="mb-4">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{seminar.category}</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">{seminar.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-6 flex-grow">{seminar.description}</p>
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Clock className="h-4 w-4 text-[#059669]" />
                          <span className="font-medium">{seminar.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <User className="h-4 w-4 text-[#059669]" />
                          <span className="font-medium">{seminar.trainer}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center max-w-3xl mx-auto">
              {user && subscription?.status === 'expired' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 mb-12">
                  <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h3>
                  <p className="text-gray-600 mb-6">Your subscription has expired. Please renew to continue accessing our premium seminars.</p>
                  <a href="#pricing" className="inline-flex justify-center items-center bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                    Renew Subscription
                  </a>
                </div>
              ) : (
                <div className="mb-16">
                  <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Unlock Premium Content</h2>
                  <p className="text-gray-600 text-lg">Subscribe to gain instant access to our entire library of expert-led health seminars.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      {!hasAccess && (
        <PricingSection onSubscribe={handleSubscribe} />
      )}

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-lg">Everything you need to know about our subscription plans.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button 
                  className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-gray-900 text-lg">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="p-6 pt-0 bg-white text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
