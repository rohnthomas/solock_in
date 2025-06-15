import React, { useState, useEffect } from 'react';
import { Clock, Zap, Shield, Target, Users, TrendingUp, AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useProgram } from '../hooks/useProgram';
import { useRegistration } from '../hooks/useRegistration';
import * as web3 from '@solana/web3.js';
import { AnchorProvider } from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import Leaderboard from './Leaderboard';

interface UserAccount {
  user: web3.PublicKey;
  name: string;
  attendanceCount: any; // BN object
  lastClockIn: any; // BN object
}

const SoLockIn = () => {
  const { publicKey, connected } = useWallet();
  const { clockIn, getUserAttendance } = useProgram();
  const { registerUser, isConnected } = useRegistration();
  const [isRegistered, setIsRegistered] = useState(false);
  const [clockedInToday, setClockedInToday] = useState(false);
  const [totalClockIns, setTotalClockIns] = useState<number>(0);
  const [userName, setUserName] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Check user status
  const checkUserStatus = async () => {
    if (!connected || !publicKey) {
      setIsRegistered(false);
      setClockedInToday(false);
      setTotalClockIns(0);
      return;
    }

    try {
      const userData = await getUserAttendance() as UserAccount;
      console.log('Fetched user data:', userData);
      
      if (userData) {
        setIsRegistered(true);
        // Convert BN to number for attendanceCount
        const totalClockIns = userData.attendanceCount ? Number(userData.attendanceCount.toString()) : 0;
        console.log('Total clock ins:', totalClockIns);
        setTotalClockIns(totalClockIns);
        
        // Check if user has clocked in today
        const today = new Date();
        const lastClockIn = userData.lastClockIn ? new Date(Number(userData.lastClockIn.toString()) * 1000) : null;
        
        if (lastClockIn && 
            lastClockIn.getDate() === today.getDate() && 
            lastClockIn.getMonth() === today.getMonth() && 
            lastClockIn.getFullYear() === today.getFullYear()) {
          setClockedInToday(true);
        } else {
          setClockedInToday(false);
        }
        
        setStatus(`Welcome back, ${userData.name}! Ready to clock in?`);
      } else {
        setIsRegistered(false);
        setClockedInToday(false);
        setTotalClockIns(0);
        setStatus('Please register to start tracking your attendance');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsRegistered(false);
      setClockedInToday(false);
      setTotalClockIns(0);
      setStatus('Please register to start tracking your attendance');
    }
  };

  // Check user status when wallet connects or disconnects
  useEffect(() => {
    checkUserStatus();
  }, [connected, publicKey]);

  // Periodically refresh user status
  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && publicKey) {
        checkUserStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [connected, publicKey]);

  // Handle registration
  const handleRegister = async () => {
    if (!userName.trim()) {
      setStatus('Please enter your name');
      return;
    }

    setLoading(true);
    setStatus('Registering your digital identity...');
    
    try {
      const tx = await registerUser(userName);
      console.log('Registration successful:', tx);
      
      // Verify registration was successful by checking user account
      const userData = await getUserAttendance() as UserAccount;
      if (!userData) {
        throw new Error('Registration verification failed');
      }
      
      setIsRegistered(true);
      setStatus('Registration successful! Welcome to the grid!');
    } catch (error) {
      console.error('Registration failed:', error);
      setStatus('Registration failed. Please try again.');
      // Don't set registered to true if registration failed
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle clock in
  const handleClockIn = async () => {
    if (!isRegistered) {
      setStatus('Please register first');
      return;
    }

    setLoading(true);
    setStatus('Marking your territory on the blockchain...');
    
    try {
      // Verify user is registered before attempting clock in
      const userData = await getUserAttendance() as UserAccount;
      if (!userData) {
        throw new Error('User not registered');
      }

      const tx = await clockIn();
      console.log('Clock in successful:', tx);
      
      // Wait for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry getting updated user data
      let retries = 3;
      let updatedUserData: UserAccount | null = null;
      
      while (retries > 0) {
        try {
          updatedUserData = await getUserAttendance() as UserAccount;
          const currentCount = updatedUserData.attendanceCount ? Number(updatedUserData.attendanceCount.toString()) : 0;
          const previousCount = userData.attendanceCount ? Number(userData.attendanceCount.toString()) : 0;
          
          if (updatedUserData && currentCount > previousCount) {
            break;
          }
        } catch (error) {
          console.log(`Retry ${4 - retries} failed, retrying...`);
        }
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (updatedUserData) {
        const totalClockIns = updatedUserData.attendanceCount ? Number(updatedUserData.attendanceCount.toString()) : 0;
        setTotalClockIns(totalClockIns);
        setClockedInToday(true);
        setStatus('BOOM! Attendance locked in! You\'re officially on the grid!');
      } else {
        // If we couldn't get updated data, increment locally
        setTotalClockIns(prev => (prev || 0) + 1);
        setClockedInToday(true);
        setStatus('BOOM! Attendance locked in! You\'re officially on the grid!');
      }
    } catch (error) {
      console.error('Clock in failed:', error);
      
      // Check if it's the "already clocked in" error
      if (error instanceof Error && error.message.includes('AlreadyClockedInToday')) {
        setClockedInToday(true);
        // Refresh user data even when already clocked in
        try {
          const userData = await getUserAttendance() as UserAccount;
          const totalClockIns = userData.attendanceCount ? Number(userData.attendanceCount.toString()) : 0;
          setTotalClockIns(totalClockIns);
          setStatus('You\'ve already clocked in today! Come back tomorrow for another round. 💪');
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError);
          setStatus('You\'ve already clocked in today! Come back tomorrow for another round. 💪');
        }
      } else {
        setStatus('Clock in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
          {Array.from({ length: 400 }).map((_, i) => (
            <div
              key={i}
              className="border border-green-900 animate-pulse"
              style={{
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-green-800 bg-black bg-opacity-90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Shield className="w-12 h-12 text-green-500 animate-spin" style={{animationDuration: '3s'}} />
              <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-wider text-green-400 drop-shadow-lg">
                SoL<span className="text-green-300">OCK</span>-IN
              </h1>
              <p className="text-green-600 text-sm tracking-widest">BLOCKCHAIN ATTENDANCE • NO ESCAPE</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {connected ? (
              <div className="flex items-center space-x-3 bg-green-900 bg-opacity-50 px-4 py-2 rounded-lg border border-green-700">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-bold">CONNECTED</span>
                <code className="text-green-500 text-xs">{publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}</code>
              </div>
            ) : (
              <div className="wallet-adapter-button-trigger">
                <WalletMultiButton className="px-6 py-3 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 
                         border-2 border-green-500 rounded-lg font-bold tracking-wider transition-all duration-300
                         hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Status Bar */}
        {status && (
          <div className="mb-8 p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-green-400 animate-spin" />
              <span className="text-green-300 font-bold tracking-wide">{status}</span>
            </div>
          </div>
        )}

        {!connected ? (
          // Landing Page
          <div className="text-center py-20">
            <div className="mb-12 relative">
              <div className="inline-block relative">
                <Clock className="w-32 h-32 text-green-500 mx-auto animate-pulse" />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            <h2 className="text-6xl font-black mb-6 tracking-wider">
              LOCK IN OR <span className="text-red-500">LOCK OUT</span>
            </h2>
            
            <div className="space-y-4 mb-12 max-w-4xl mx-auto">
              <p className="text-2xl text-green-300 font-bold">
                🔥 THE MOST SAVAGE ATTENDANCE SYSTEM ON SOLANA 🔥
              </p>
              <p className="text-xl text-green-400">
                No cap, no lies, no excuses. Just pure blockchain accountability.
              </p>
              <p className="text-lg text-green-500">
                Clock in daily or get left behind. This ain't your average attendance tracker - this is BLOCKCHAIN LEVEL COMMITMENT.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
              {[
                { icon: Shield, title: 'BULLETPROOF', desc: 'Solana blockchain security. Your attendance is IMMORTAL.' },
                { icon: Zap, title: 'LIGHTNING FAST', desc: 'Clock in faster than your excuses. Sub-second transactions.' },
                { icon: Target, title: 'NO MERCY', desc: 'One chance per day. Miss it and face the consequences.' }
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg hover:border-green-600 transition-all duration-300 group">
                  <feature.icon className="w-12 h-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-green-400 mb-2">{feature.title}</h3>
                  <p className="text-green-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !isRegistered ? (
          // Registration Flow
          <div className="max-w-2xl mx-auto py-12">
            <div className="text-center mb-8">
              <User className="w-24 h-24 text-green-500 mx-auto mb-6 animate-bounce" />
              <h2 className="text-4xl font-black mb-4 tracking-wider">JOIN THE ELITE</h2>
              <p className="text-xl text-green-400">Time to register your identity in the system, soldier.</p>
            </div>

            <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-8 backdrop-blur-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-green-400 font-bold mb-2 tracking-wide">OPERATIVE NAME</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your handle..."
                    className="w-full p-4 bg-black border-2 border-green-800 rounded-lg text-green-400 font-mono
                             focus:border-green-500 focus:outline-none focus:shadow-lg focus:shadow-green-500/20
                             placeholder-green-700"
                    maxLength={20}
                  />
                  <p className="text-green-600 text-sm mt-2">Choose wisely. This name will be your legend.</p>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={!userName.trim() || loading}
                  className="w-full py-4 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500
                           border-2 border-green-500 rounded-lg font-bold text-xl tracking-wider transition-all duration-300
                           hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'REGISTERING...' : 'REGISTER & LOCK IN'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center py-8">
              <h2 className="text-5xl font-black mb-4 tracking-wider">
                WELCOME BACK, <span className="text-green-300">{userName.toUpperCase()}</span>
              </h2>
              <p className="text-xl text-green-400">Ready to mark your territory on the blockchain?</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL LOCK-INS', value: totalClockIns.toString(), icon: TrendingUp, color: 'text-green-400' },
                { label: 'TODAY\'S STATUS', value: clockedInToday ? 'LOCKED' : 'PENDING', icon: clockedInToday ? CheckCircle : AlertTriangle, color: clockedInToday ? 'text-green-400' : 'text-red-400' },
                { label: 'STREAK LEVEL', value: '🔥 SAVAGE', icon: Target, color: 'text-orange-400' },
                { label: 'RANK', value: 'ELITE', icon: Shield, color: 'text-purple-400' }
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg backdrop-blur-sm hover:border-green-600 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <span className="text-green-600 text-sm font-bold">{stat.label}</span>
                  </div>
                  <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Clock In Section */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-900 to-green-800 bg-opacity-40 border-2 border-green-600 rounded-xl p-8 backdrop-blur-sm">
                <div className="text-center mb-8">
                  <Calendar className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-3xl font-black mb-2 tracking-wider">DAILY LOCK-IN</h3>
                  <p className="text-green-400">
                    {clockedInToday 
                      ? "You've already locked in today. Respect! 💪"
                      : "Time to prove your commitment. Lock in NOW!"
                    }
                  </p>
                </div>

                {clockedInToday ? (
                  <div className="text-center p-6 bg-green-900 bg-opacity-50 border border-green-600 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-green-400 mb-2">ATTENDANCE CONFIRMED</p>
                    <p className="text-green-500">You're locked in for today! Come back tomorrow for another round.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 border-2 border-green-500 rounded-lg font-bold text-xl tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'LOCKING IN...' : 'LOCK IN NOW'}
                  </button>
                )}
              </div>
            </div>

            {/* Leaderboard Section */}
            <Leaderboard />

            {/* Motivational Section */}
            <div className="text-center py-8">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-black mb-6 text-green-400">DAILY MOTIVATION</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "💀 Consistency is the weapon of champions. Lock in daily or get left behind.",
                    "⚡ Every clock-in is a step toward greatness. No excuses, no mercy.",
                    "🔥 The blockchain never lies. Your commitment is permanent and public.",
                    "💎 Diamonds are formed under pressure. Lock in and become unbreakable."
                  ].map((quote, i) => (
                    <div key={i} className="p-4 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg">
                      <p className="text-green-300 font-bold">{quote}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 p-6 border-t border-green-800 bg-black bg-opacity-90">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-green-600 font-bold tracking-wider">
            POWERED BY SOLANA • BUILT FOR LEGENDS • NO COMPROMISES
          </p>
          <p className="text-green-700 text-sm mt-2">
            SoLock-In v1.0 - Where commitment meets blockchain technology
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SoLockIn; 