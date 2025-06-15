import type { FC } from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import SoLockIn from './components/SoLockIn';
import InitializeSystem from './components/InitializeSystem';

// Program ID from the deployed contract
export const PROGRAM_ID = 'GMV2GPn4XJwz8uocRtRiwDEYjgBRnZKXRt9c3uxWktos';

const App: FC = () => {
  const wallets = [new PhantomWalletAdapter()];
  const endpoint = clusterApiUrl('devnet'); // Use Solana devnet

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
            <div className="relative z-10 p-6">
              <div className="max-w-7xl mx-auto">
                <InitializeSystem />
          <SoLockIn />
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;