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
  increment
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
  CheckCircle2
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
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

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
    // Simulate Ad Watching
    toast.loading("Watching Ad...", { duration: 2000 });
    
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          coins: increment(50)
        });
        toast.dismiss();
        toast.success("Ad Completed! +50 Coins");
      } catch (error: any) {
        toast.error("Failed to reward coins");
      } finally {
        setIsActionLoading(false);
      }
    }, 2000);
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
              <h3 className="text-lg font-bold px-1">Recent Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <Coins className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Reward Claimed</p>
                        <p className="text-xs text-slate-500">2 hours ago</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">+50</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Banner Ad Placeholder */}
            <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto">
              <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 flex items-center justify-center text-xs text-slate-500 font-medium tracking-widest uppercase">
                Sponsored Advertisement
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
