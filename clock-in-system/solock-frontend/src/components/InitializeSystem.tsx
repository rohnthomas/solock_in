import { useState } from 'react';
import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { initializeAttendanceSystem } from '../scripts/initialize';

const InitializeSystem: FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { publicKey } = useWallet();

  const handleInitialize = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await initializeAttendanceSystem();
      setSuccess(true);
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize system');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xs bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-xl shadow-green-700/40 shadow-lg p-4 mt-4 mx-auto flex flex-col items-center backdrop-blur-sm">
      <h2 className="text-xl font-black text-green-400 mb-3 tracking-wider drop-shadow-lg">Initialize System</h2>
      <div className="space-y-3 w-full">
        <button
          onClick={handleInitialize}
          disabled={loading || !publicKey}
          className={`w-full py-2 px-4 border-2 border-green-500 rounded-lg shadow-green-500/30 shadow-sm text-sm font-bold text-green-200 font-mono tracking-wider transition-all duration-200
            ${loading || !publicKey 
              ? 'bg-green-800 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
            }`}
        >
          {loading ? 'Initializing...' : 'Initialize System'}
        </button>
        
        {error && (
          <div className="text-red-400 text-xs text-center font-mono">{error}</div>
        )}
        
        {success && (
          <div className="text-green-400 text-xs text-center font-mono">
            System initialized successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default InitializeSystem; 