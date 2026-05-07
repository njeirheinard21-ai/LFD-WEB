import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Lock, AlertCircle, ShieldCheck, ArrowRight, VideoOff, Radio, Maximize, Minimize, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { PricingSection } from '../components/PricingSection';
import { useTranslation } from 'react-i18next';

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

export default function LiveSeminars() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 6000);
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
    const handleTouch = () => {
      resetControlsTimeout();
    };
    
    const handleWindowBlur = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        resetControlsTimeout();
        setTimeout(() => {
          window.focus();
        }, 100);
      }
    };

    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    // Intercept and prevent any native fullscreen attempts by the iframe
    const preventNativeFullscreen = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', preventNativeFullscreen);
    return () => document.removeEventListener('fullscreenchange', preventNativeFullscreen);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Admin bypass: njeirheinard21@gmail.com gets direct access
      if (user.email?.toLowerCase() === 'njeirheinard21@gmail.com') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const path = 'subscriptions';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', user.id),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setHasAccess(false);
          setTimeout(() => navigate('/seminars'), 3000);
          return;
        }

        const sub = snapshot.docs[0].data();
        const expiryDate = new Date(sub.expiryDate);

        if (new Date() > expiryDate) {
          setHasAccess(false);
          setTimeout(() => navigate('/seminars'), 3000);
          return;
        }

        setHasAccess(true);
      } catch (err) {
        console.error("Access check error:", err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading, navigate]);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-red-50 text-red-700 py-4 px-4 text-center font-bold flex flex-col sm:flex-row items-center justify-center gap-2 border-b border-red-100">
          <Lock className="h-5 w-5" />
          <span>{t('live.restricted', 'Live Seminar Access Restricted - Please activate your subscription')}</span>
        </div>
        <div className="flex-grow">
          <PricingSection 
            onSubscribe={(plan) => {
              navigate('/seminars');
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('live.session', 'Live Seminar Session')}</h1>
            <p className="text-gray-600 mt-2">{t('live.welcome', 'Welcome to your exclusive live seminar access.')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-green-50 text-green-700 border border-green-100">
              <ShieldCheck className="h-4 w-4" /> {t('live.subscription_active', 'Subscription Active')}
            </span>
          </div>
        </div>

        {liveStream?.isLive ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            <div className="lg:col-span-2 space-y-6">
              <div id="seminarContent" className="bg-white p-2 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className={`bg-black flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none' : 'aspect-video rounded-[1.5rem] w-full'}`} ref={videoContainerRef}>
                  {getYouTubeId(liveStream.streamUrl) ? (
                    <div 
                      className="relative w-full h-full select-none bg-black group" 
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                      onMouseMove={resetControlsTimeout}
                      onTouchStart={resetControlsTimeout}
                      onMouseEnter={resetControlsTimeout}
                      onMouseLeave={() => setShowControls(false)}
                      onClick={resetControlsTimeout}
                    >
                      {/* Transparent full overlay click shield */}
                      <div className="absolute inset-0 z-10 pointer-events-none" />

                      {/* 🔒 Overlay Blockers */}
                      
                      {/* Left Block (blocks share/link) */}
                      <div className="absolute bottom-0 left-0 w-[200px] h-[120px] z-40 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />

                      {/* Right Block (blocks YouTube logo and fullscreen) */}
                      <div className="absolute bottom-0 right-0 w-[200px] h-[120px] z-40 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />
                      
                      {/* Bottom Block (blocks entire control bar) */}
                      <div className="absolute bottom-0 left-0 w-full h-[80px] z-40 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />

                      {/* Top Block (blocks title and avatar) */}
                      <div className="absolute top-0 left-0 w-full h-[100px] z-40 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />

                      {/* Secure YouTube Iframe Embed */}
                      <iframe 
                        className="w-full h-full z-0 relative pointer-events-auto"
                        src={`https://www.youtube.com/embed/${getYouTubeId(liveStream.streamUrl)}?modestbranding=1&rel=0&controls=1&disablekb=1&fs=0&playsinline=1`}
                        title={liveStream.title}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                      />
                      
                      {/* 🎛 Controls */}
                      <AnimatePresence>
                        {showControls && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-3 right-3 z-50 flex gap-2 pointer-events-auto"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFullscreen();
                              }}
                              className="bg-black/70 hover:bg-black text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-md border border-white/10"
                            >
                              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ❌ Close button in fullscreen */}
                      <AnimatePresence>
                        {showControls && isFullscreen && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFullscreen(false);
                            }}
                            className="absolute top-3 left-3 z-[60] bg-black/70 hover:bg-black text-white p-2 rounded-md transition-all flex items-center justify-center backdrop-blur-md border border-white/10 pointer-events-auto"
                            aria-label="Close Fullscreen"
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center p-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-white font-bold">{t('live.invalid_url', 'Invalid Stream URL')}</p>
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
                      {t('live.started', 'Started')} {new Date(liveStream.startedAt).toLocaleTimeString()}
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
                    {t('live.chat_title', 'Live Community Chat')}
                  </h3>
                </div>
                
                {liveStream.chatEnabled ? (
                  <>
                    <div className="flex-grow p-6 flex flex-col items-center justify-center text-center bg-white">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">{t('live.chat_read_only', 'Chat is currently in read-only mode')}</p>
                      <p className="text-gray-400 text-sm mt-1">{t('live.chat_wait', 'The moderator will enable messaging shortly.')}</p>
                    </div>
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                      <div className="relative">
                        <input 
                          type="text" 
                          disabled
                          placeholder={t('live.type_question', 'Type your question...')} 
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
                    <p className="text-gray-500 font-bold">{t('live.chat_disabled', 'Chat Disabled')}</p>
                    <p className="text-gray-400 text-sm mt-1">{t('live.host_disabled', 'The host has disabled live chat for this session.')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-12 md:p-20 text-center max-w-3xl mx-auto animate-in fade-in zoom-in duration-500 overflow-hidden relative">
            {liveStream?.thumbnailUrl && (
              <div className="absolute inset-0 z-0">
                <img src={liveStream.thumbnailUrl} alt="Live Stream Thumbnail" referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover opacity-20 filter blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
              </div>
            )}
            
            <div className="relative z-10">
              {liveStream?.thumbnailUrl ? (
                <div className="w-full max-w-md mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl mb-8 relative border-4 border-white">
                  <img src={liveStream.thumbnailUrl} alt="Thumbnail" referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                    <VideoOff className="w-4 h-4" /> Offline
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <VideoOff className="h-12 w-12 text-gray-300" />
                </div>
              )}
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('live.no_live', 'No Live Seminar Running')}</h2>
              <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
                {t('live.no_live_desc', 'There are currently no live sessions in progress. Check the schedule or your email for upcoming seminar announcements.')}
              </p>
              <button 
                onClick={() => navigate('/seminars')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
              >
                {t('live.browse_past', 'Browse Past Seminars')} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
