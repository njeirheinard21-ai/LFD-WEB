import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Lock, AlertCircle, ShieldCheck, ArrowRight, VideoOff, Radio, Maximize, Minimize, X, Smile } from 'lucide-react';
const LazyEmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { collection, query, where, getDocs, doc, onSnapshot, addDoc } from 'firebase/firestore';
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

interface SeminarMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  streamStartedAt: string;
}

export default function LiveSeminars() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [messages, setMessages] = useState<SeminarMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    if (liveStream?.isLive && liveStream.startedAt) {
      const messagesRef = collection(db, 'seminarMessages');
      const q = query(
        messagesRef,
        where('streamStartedAt', '==', liveStream.startedAt)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SeminarMessage[];
        
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      }, (err) => {
        console.error("Chat fetch error:", err);
      });
      return () => unsubscribe();
    }
  }, [liveStream?.isLive, liveStream?.startedAt]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !liveStream) return;

    try {
      const messagesRef = collection(db, 'seminarMessages');
      await addDoc(messagesRef, {
        userId: user.id,
        userName: user.fullName || 'User',
        text: newMessage.trim(),
        createdAt: new Date().toISOString(),
        streamStartedAt: liveStream.startedAt
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

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

  useEffect(() => {
    if (hasAccess && liveStream?.isLive && user) {
      const recordAttendance = async () => {
        try {
          const attendanceRef = collection(db, 'seminarAttendance');
          const q = query(
            attendanceRef,
            where('userId', '==', user.id),
            where('startedAt', '==', liveStream.startedAt)
          );
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(attendanceRef, {
              userId: user.id,
              userEmail: user.email,
              userName: user.fullName || '',
              streamTitle: liveStream.title,
              startedAt: liveStream.startedAt,
              joinedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error recording attendance:", error);
        }
      };
      
      recordAttendance();
    }
  }, [hasAccess, liveStream?.isLive, liveStream?.startedAt, user]);

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
    <div className="min-h-screen bg-gray-50 pb-12 pt-4 md:pt-12">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{t('live.session', 'Live Seminar Session')}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">{t('live.welcome', 'Welcome to your exclusive live seminar access.')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold bg-green-50 text-green-700 border border-green-100">
              <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" /> {t('live.subscription_active', 'Subscription Active')}
            </span>
          </div>
        </div>

        {liveStream?.isLive ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-8 animate-in fade-in duration-700">
            <div className="lg:col-span-2 flex flex-col">
              <div 
                id="seminarContent" 
                className={`bg-black sm:shadow-2xl sm:rounded-2xl relative w-full mb-6 sm:mb-8 flex flex-col items-center justify-center transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen rounded-none' : 'aspect-video overflow-hidden border-y sm:border border-gray-900/10'}`}
                ref={videoContainerRef}
              >
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
                    <div className="absolute bottom-0 left-0 w-[200px] h-[120px] z-30 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />

                    {/* Right Block (blocks YouTube logo and fullscreen) */}
                    <div className="absolute bottom-0 right-0 w-[200px] h-[120px] z-30 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />
                    
                    {/* Bottom Block (blocks entire control bar) */}
                    {/* <div className="absolute bottom-0 left-0 w-full h-[80px] z-30 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} /> */}

                    {/* Top Block (blocks title and avatar) */}
                    <div className="absolute top-0 left-0 w-full h-[100px] z-30 pointer-events-auto cursor-default bg-transparent" onContextMenu={(e) => e.preventDefault()} />

                    {/* Secure YouTube Iframe Embed */}
                    <iframe 
                      className="w-full h-full z-0 relative pointer-events-auto"
                      src={`https://www.youtube.com/embed/${getYouTubeId(liveStream.streamUrl)}?modestbranding=1&rel=0&controls=1&disablekb=1&fs=0&playsinline=1`}
                      title={liveStream.title}
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                    />
                    
                    {/* 🎛 Controls - Custom Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none transition-opacity duration-300 z-40 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

                    <AnimatePresence>
                      {showControls && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-4 right-4 z-50 flex gap-2 pointer-events-auto"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFullscreen();
                            }}
                            className="bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 backdrop-blur-md shadow-lg border border-white/10"
                          >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ❌ Close button in fullscreen */}
                    <AnimatePresence>
                      {showControls && isFullscreen && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(false);
                          }}
                          className="absolute top-6 right-6 lg:top-8 lg:right-8 z-[60] bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all flex items-center justify-center backdrop-blur-md border border-white/10 pointer-events-auto shadow-2xl"
                          aria-label="Close Fullscreen"
                        >
                          <X className="w-6 h-6" />
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

              <div className="bg-white sm:rounded-[2rem] shadow-sm sm:border border-gray-100 p-6 sm:p-8 flex-shrink-0 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 hidden sm:flex">
                    <PlayCircle className="h-6 w-6 text-[#059669]" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{liveStream.title}</h2>
                    <p className="text-xs sm:text-sm text-[#059669] font-semibold tracking-wider mt-1.5 flex items-center gap-2">
                       <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]"></span>
                      </span>
                      {t('live.started', 'Started')} {new Date(liveStream.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {liveStream.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col animate-in slide-in-from-bottom-8 duration-500 delay-300 px-0 sm:px-0 mt-6 sm:mt-0">
              <div className="bg-white px-4 sm:px-0 sm:rounded-[2rem] shadow-sm sm:border border-gray-100 h-[500px] sm:h-[600px] xl:h-[700px] flex flex-col overflow-hidden w-full">
                <div className="py-4 sm:p-6 sm:border-y-0 border-y border-gray-100 sm:bg-gray-50/50 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {t('live.chat_title', 'Live Community Chat')}
                  </h3>
                </div>
                
                  <div className="flex flex-col h-full bg-white relative">
                    <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4 absolute inset-0 bottom-[80px]">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                          <p>{t('live.chat_empty', 'Be the first to send a message!')}</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-700">{msg.userId === user?.id ? 'You' : msg.userName}</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`px-4 py-2 max-w-[85%] text-sm break-words ${msg.userId === user?.id ? 'bg-[#059669] text-white rounded-2xl rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 border-t border-gray-100 bg-white">
                      <div className="relative" ref={emojiPickerRef}>
                        <AnimatePresence>
                          {showEmojiPicker && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100"
                            >
                              <Suspense fallback={
                                <div className="w-[350px] h-[350px] flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-xl">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
                                </div>
                              }>
                                <LazyEmojiPicker 
                                  onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} 
                                  theme="light" 
                                  lazyLoadEmojis={true}
                                />
                              </Suspense>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <form onSubmit={handleSendMessage} className="relative shadow-sm rounded-2xl flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#059669] transition-colors rounded-lg hover:bg-gray-100 z-10"
                          >
                            <Smile className="h-5 w-5" />
                          </button>
                          <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('live.type_question', 'Type your message...')} 
                            className="w-full pl-12 pr-14 py-3.5 sm:py-4 bg-gray-50/50 sm:bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] focus:outline-none placeholder:text-gray-400"
                          />
                          <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#059669] text-white rounded-xl hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-colors z-10">
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-gray-100 p-8 sm:p-12 md:p-20 text-center max-w-3xl mx-4 sm:mx-auto animate-in fade-in zoom-in duration-500 overflow-hidden relative">
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
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                  <VideoOff className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
                </div>
              )}
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{t('live.no_live', 'No Live Seminar Running')}</h2>
              <p className="text-gray-600 text-sm sm:text-lg mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto">
                {t('live.no_live_desc', 'There are currently no live sessions in progress. Check the schedule or your email for upcoming seminar announcements.')}
              </p>
              <button 
                onClick={() => navigate('/seminars')}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-black transition-all shadow-lg text-sm sm:text-base"
              >
                {t('live.browse_past', 'Browse Past Seminars')} <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
