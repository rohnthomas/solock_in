import React, { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new web3.PublicKey('GMV2GPn4XJwz8uocRtRiwDEYjgBRnZKXRt9c3uxWktos');

interface UserAccount {
  user: PublicKey;
  name: string;
  attendanceCount: any; // BN
  lastClockIn: any; // BN
}

const Leaderboard: React.FC = () => {
  const { connection } = useConnection();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const provider = new AnchorProvider(connection, (window as any).solana, { commitment: 'confirmed' });
        const program = new Program(IDL as any, PROGRAM_ID, provider);
        // Fetch all user accounts
        const allUserAccounts = await program.account.userAccount.all();
        // Map and sort by attendanceCount (descending)
        const sorted = allUserAccounts
          .map((ua: any) => ({
            user: ua.account.user,
            name: ua.account.name,
            attendanceCount: ua.account.attendanceCount ?? ua.account.totalClockIns, // fallback for legacy
            lastClockIn: ua.account.lastClockIn ?? ua.account.last_clock_in,
          }))
          .sort((a, b) => Number(b.attendanceCount?.toString() || 0) - Number(a.attendanceCount?.toString() || 0))
          .slice(0, 10);
        setUsers(sorted);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [connection]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-xl shadow-green-700/40 shadow-lg p-4 mt-8 backdrop-blur-sm">
      <h2 className="text-2xl font-black text-green-400 mb-4 tracking-wider drop-shadow-lg text-center flex items-center justify-center gap-2">
        <span>🏆</span> LEADERBOARD
      </h2>
      {loading ? (
        <div className="text-green-300 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-400 text-center">{error}</div>
      ) : (
        <ol className="space-y-2">
          {users.length === 0 ? (
            <li className="text-green-600 text-center">No users yet</li>
          ) : (
            users.map((user, idx) => (
              <li
                key={user.user.toString()}
                className={`flex items-center justify-between px-4 py-2 rounded-lg border border-green-700 bg-green-950 bg-opacity-60 ${idx === 0 ? 'border-2 border-yellow-400 shadow-yellow-400/40' : ''}`}
              >
                <span className="font-mono text-green-300 font-bold">
                  #{idx + 1} {user.name}
                </span>
                <span className="text-green-400 font-black text-lg">
                  {Number(user.attendanceCount?.toString() || 0)}
                </span>
              </li>
            ))
          )}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard; 