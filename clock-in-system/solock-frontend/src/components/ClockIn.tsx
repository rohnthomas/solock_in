import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { PROGRAM_ID } from '../App';

const ClockIn: FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const handleClockIn = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const provider = new AnchorProvider(connection, window.solana, {});
      const program = new Program(IDL, PROGRAM_ID, provider);

      const [userAccount] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('user'), publicKey.toBuffer()],
        program.programId
      );

      const currentDay = Math.floor(Date.now() / 86400000);
      const [attendanceRecord] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from('attendance'),
          publicKey.toBuffer(),
          new Uint8Array(new Uint64Array([currentDay]).buffer),
        ],
        program.programId
      );

      const tx = await program.methods
        .clockIn()
        .accounts({
          userAccount,
          attendanceRecord,
          user: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Clock-in successful:', tx);
      setSuccess(true);
    } catch (err) {
      console.error('Clock-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Clock-In</h2>
      <div className="space-y-4">
        <button
          onClick={handleClockIn}
          disabled={loading || !publicKey}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${loading || !publicKey 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
        >
          {loading ? 'Processing...' : 'Clock In'}
        </button>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        {success && (
          <div className="text-green-500 text-sm">
            Successfully clocked in for today!
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockIn; 