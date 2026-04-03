/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Coins, 
  Gift, 
  PlayCircle, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Loader2,
  TrendingUp,
  Wallet,
  CheckCircle2,
  History,
  X,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { formatDistanceToNow, isAfter, addHours } from 'date-fns';
import { cn } from './lib/utils';

// Types
interface UserProfile {
  uid: string;
  email: string;
  coins: number;
  lastDailyBonus?: any;
  createdAt: any;
}

interface Transaction {
  id: string;
  type: 'bonus' | 'ad' | 'spend';
  amount: number;
  description: string;
  timestamp: any;
}

// Components
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="w-12 h-12 text-primary" />
    </motion.div>
    <p className="mt-4 text-slate-400 animate-pulse">Loading CoinEarn...</p>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAppOpenAd, setShowAppOpenAd] = useState(false);

  // Simulate App Open Ad on Login
  useEffect(() => {
    if (user && !loading) {
      const hasSeenAd = sessionStorage.getItem('hasSeenAppOpenAd');
      if (!hasSeenAd) {
        setShowAppOpenAd(true);
        sessionStorage.setItem('hasSeenAppOpenAd', 'true');
        // Auto-close after 5 seconds
        setTimeout(() => setShowAppOpenAd(false), 5000);
      }
    }
  }, [user, loading]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile Listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Create profile if it doesn't exist
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          coins: 0,
          createdAt: serverTimestamp(),
        };
        setDoc(doc(db, 'users', user.uid), newProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Failed to load profile data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Transactions Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  const claimDailyBonus = async () => {
    if (!user || !profile) return;
    
    const now = new Date();
    const lastBonus = profile.lastDailyBonus?.toDate();
    
    if (lastBonus && !isAfter(now, addHours(lastBonus, 24))) {
      const nextClaim = addHours(lastBonus, 24);
      toast.error(`Next claim available in ${formatDistanceToNow(nextClaim)}`);
      return;
    }

    setIsActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: increment(100),
        lastDailyBonus: serverTimestamp()
      });
      
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'bonus',
        amount: 100,
        description: 'Daily Bonus Claimed',
        timestamp: serverTimestamp()
      });

      toast.success("Daily Bonus Claimed! +100 Coins");
    } catch (error: any) {
      toast.error("Failed to claim bonus");
    } finally {
      setIsActionLoading(false);
    }
  };

  const watchAd = async () => {
    if (!user) return;
    
    setIsActionLoading(true);
    // Simulate Ad Watching with provided Unit ID
    const adUnitId = import.meta.env.VITE_ADMOB_REWARDED_UNIT_ID || "ca-app-pub-6776734432817673/7967035834";
    toast.loading(`Loading Ad Unit: ${adUnitId.split('/').pop()}...`, { duration: 3000 });
    
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          coins: increment(50)
        });

        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
          type: 'ad',
          amount: 50,
          description: `Watched Ad (${adUnitId.split('/').pop()})`,
          timestamp: serverTimestamp()
        });

        toast.dismiss();
        toast.success("Ad Completed! +50 Coins");
      } catch (error: any) {
        toast.error("Failed to reward coins");
      } finally {
        setIsActionLoading(false);
      }
    }, 3000);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-primary/30">
      <Toaster position="top-center" reverseOrder={false} />
      
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md card">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                  <Coins className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">CoinEarn</h1>
                <p className="text-slate-400 mt-2">Start earning coins today!</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full input-field pl-12"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full input-field pl-12"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full gradient-button mt-4 flex items-center justify-center gap-2"
                >
                  {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto p-4 md:p-8 pb-24"
          >
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Welcome back,</p>
                  <p className="font-semibold text-sm truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </header>

            {/* Balance Card */}
            <section className="relative overflow-hidden card bg-linear-to-br from-slate-800 to-slate-900 border-primary/20 mb-6">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Total Balance</span>
                </div>
                <div className="flex items-end gap-3">
                  <h2 className="text-5xl font-bold text-white">{profile?.coins || 0}</h2>
                  <span className="text-slate-400 mb-2 font-medium">Coins</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Conversion Rate: <span className="text-accent">1000 Coins = 300 PKR</span></p>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </div>
                </div>
              </div>
            </section>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={claimDailyBonus}
                disabled={isActionLoading}
                className="group relative flex flex-col items-center justify-center p-8 card hover:border-primary/50 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gift className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-bold text-lg">Daily Bonus</h3>
                <p className="text-sm text-slate-400 mt-1">Claim 100 coins daily</p>
                <div className="absolute top-2 right-2">
                   <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                </div>
              </button>

              <button
                onClick={watchAd}
                disabled={isActionLoading}
                className="group flex flex-col items-center justify-center p-8 card hover:border-primary/50 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">Watch Ad</h3>
                <p className="text-sm text-slate-400 mt-1">Earn 50 coins instantly</p>
              </button>
            </div>

            {/* Stats/History Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <button 
                  onClick={() => setShowHistoryModal(true)}
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <History className="w-4 h-4" />
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          tx.type === 'bonus' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                        )}>
                          {tx.type === 'bonus' ? <Gift className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {tx.timestamp?.toDate() ? formatDistanceToNow(tx.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        {tx.amount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                    No transactions yet. Start earning!
                  </div>
                )}
              </div>
            </section>

            {/* History Modal */}
            <AnimatePresence>
              {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowHistoryModal(false)}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="relative w-full max-w-lg bg-card border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]"
                  >
                    <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <History className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">Coin History</h2>
                      </div>
                      <button 
                        onClick={() => setShowHistoryModal(false)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              tx.type === 'bonus' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                            )}>
                              {tx.type === 'bonus' ? <Gift className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{tx.description}</p>
                              <p className="text-xs text-slate-500">
                                {tx.timestamp?.toDate() ? tx.timestamp.toDate().toLocaleString() : 'Just now'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                            <ArrowUpRight className="w-4 h-4" />
                            {tx.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-6 border-t border-slate-700 bg-slate-900/50">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Total Transactions</span>
                        <span className="font-bold text-primary">{transactions.length}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* App Open Ad Simulation Overlay */}
            <AnimatePresence>
              {showAppOpenAd && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="absolute top-6 right-6">
                    <button 
                      onClick={() => setShowAppOpenAd(false)}
                      className="bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full text-slate-400 text-xs font-bold flex items-center gap-2"
                    >
                      Continue to App <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
                    <Coins className="w-12 h-12 text-primary" />
                  </div>

                  <h2 className="text-3xl font-bold mb-2">CoinEarn</h2>
                  <p className="text-slate-400 mb-12">Your daily rewards are waiting!</p>

                  <div className="w-full max-w-sm aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute top-2 left-2 bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                      Ad • 7215189380
                    </div>
                    <PlayCircle className="w-12 h-12 text-slate-700 mb-4" />
                    <div className="h-2 w-3/4 bg-slate-800 rounded-full mb-2" />
                    <div className="h-2 w-1/2 bg-slate-800 rounded-full" />
                    
                    <div className="mt-8 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>

                  <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest">App Open Ad Simulation</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Banner Ad Placeholder */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex flex-col items-center justify-center p-1 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
              <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">
                Advertisement • Unit: 7967035834
              </div>
              <div className="w-full max-w-[320px] h-[50px] bg-slate-800 rounded flex items-center justify-center border border-slate-700 animate-pulse">
                <span className="text-xs text-slate-400 font-medium">Google AdMob Banner Ad</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
