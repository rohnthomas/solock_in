import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { PROGRAM_ID } from '../App';

const UserRegistration: FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const provider = new AnchorProvider(connection, window.solana, {});
      const program = new Program(IDL, PROGRAM_ID, provider);

      const [userAccount] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('user'), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .registerUser(name)
        .accounts({
          userAccount,
          user: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Registration successful:', tx);
      setName('');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Register User</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading || !publicKey}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${loading || !publicKey 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default UserRegistration; 