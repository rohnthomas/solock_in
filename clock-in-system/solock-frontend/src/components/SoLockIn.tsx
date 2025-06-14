import React, { useState } from 'react';
import { Clock, Zap, Shield, Target, Users, TrendingUp, AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react';

const SoLockIn = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [clockedInToday, setClockedInToday] = useState(false);
  const [totalClockIns, setTotalClockIns] = useState(0);
  const [userName, setUserName] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Simulate wallet connection
  const connectWallet = async () => {
    setLoading(true);
    setStatus('Connecting to the blockchain like a boss...');
    setTimeout(() => {
      setIsConnected(true);
      setUserAccount('3QX9...RAg');
      setStatus("Wallet connected! You're in the game now!");
      setLoading(false);
    }, 2000);
  };

  // Simulate user registration
  const registerUser = async () => {
    if (!userName.trim()) return;
    setLoading(true);
    setStatus('Registering your presence in the system...');
    setTimeout(() => {
      setIsRegistered(true);
      setShowRegister(false);
      setStatus(`Welcome to the crew, ${userName}! You're locked and loaded!`);
      setLoading(false);
    }, 2500);
  };

  // Simulate clock in
  const clockIn = async () => {
    setLoading(true);
    setStatus('Marking your territory on the blockchain...');
    setTimeout(() => {
      setClockedInToday(true);
      setTotalClockIns(prev => prev + 1);
      setStatus("BOOM! Attendance locked in! You're officially on the grid!");
      setLoading(false);
    }, 3000);
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
            {isConnected ? (
              <div className="flex items-center space-x-3 bg-green-900 bg-opacity-50 px-4 py-2 rounded-lg border border-green-700">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-bold">CONNECTED</span>
                <code className="text-green-500 text-xs">{userAccount}</code>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 \
                         border-2 border-green-500 rounded-lg font-bold tracking-wider transition-all duration-300\n                         hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50"
              >
                {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
              </button>
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

        {!isConnected ? (
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
                    className="w-full p-4 bg-black border-2 border-green-800 rounded-lg text-green-400 font-mono\n                             focus:border-green-500 focus:outline-none focus:shadow-lg focus:shadow-green-500/20\n                             placeholder-green-700"
                    maxLength={20}
                  />
                  <p className="text-green-600 text-sm mt-2">Choose wisely. This name will be your legend.</p>
                </div>
                <button
                  onClick={registerUser}
                  disabled={!userName.trim() || loading}
                  className="w-full py-4 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500\n                           border-2 border-green-500 rounded-lg font-bold text-xl tracking-wider transition-all duration-300\n                           hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                { label: 'TOTAL LOCK-INS', value: totalClockIns, icon: TrendingUp, color: 'text-green-400' },
                { label: "TODAY'S STATUS", value: clockedInToday ? 'LOCKED' : 'PENDING', icon: clockedInToday ? CheckCircle : AlertTriangle, color: clockedInToday ? 'text-green-400' : 'text-red-400' },
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
                    onClick={clockIn}
                    disabled={loading}
                    className="w-full py-6 bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400\n                             border-2 border-green-400 rounded-xl font-black text-2xl tracking-widest transition-all duration-300\n                             hover:shadow-xl hover:shadow-green-500/50 transform hover:scale-105 disabled:opacity-50\n                             animate-pulse hover:animate-none"
                  >
                    {loading ? '⚡ LOCKING IN...' : '🔒 LOCK IN NOW'}
                  </button>
                )}
              </div>
            </div>
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