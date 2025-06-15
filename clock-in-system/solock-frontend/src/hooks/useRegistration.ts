import { useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new web3.PublicKey('GMV2GPn4XJwz8uocRtRiwDEYjgBRnZKXRt9c3uxWktos');

export const useRegistration = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    return new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(IDL as any, PROGRAM_ID, provider);
  }, [provider]);

  const isConnected = useMemo(() => {
    return wallet.connected && !!wallet.publicKey;
  }, [wallet.connected, wallet.publicKey]);

  const registerUser = async (name: string): Promise<string> => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    
    console.log('Starting registration process...');
    console.log('Program ID:', PROGRAM_ID.toString());
    console.log('User public key:', wallet.publicKey.toString());

    try {
      // Get user account PDA
      const [userAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('user'), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );
      console.log('User account PDA:', userAccount.toString());

      // Get attendance system PDA
      const [attendanceSystem] = PublicKey.findProgramAddressSync(
        [Buffer.from('attendance_system')],
        PROGRAM_ID
      );
      console.log('Attendance system PDA:', attendanceSystem.toString());

      console.log('Sending registration transaction...');
      
      // Add retry logic for transaction
      let retries = 3;
      let lastError: any;
      
      while (retries > 0) {
        try {
          const tx = await program.methods
            .registerUser(name)
            .accounts({
              userAccount,
              user: wallet.publicKey,
              attendanceSystem,
              systemProgram: web3.SystemProgram.programId,
            })
            .rpc();
            
          console.log('Registration transaction sent:', tx);
          return tx;
        } catch (error: any) {
          lastError = error;
          // If it's not a "transaction already processed" error, break
          if (!error.message?.includes('already been processed')) {
            break;
          }
          retries--;
          if (retries > 0) {
            console.log(`Retrying registration... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('Detailed registration error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  return {
    registerUser,
    isConnected,
  };
}; 