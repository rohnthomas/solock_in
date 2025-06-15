import { useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

const PROGRAM_ID = new web3.PublicKey('GMV2GPn4XJwz8uocRtRiwDEYjgBRnZKXRt9c3uxWktos');

export const useProgram = () => {
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

  const clockIn = async () => {
    if (!wallet.publicKey || !program || !wallet.signTransaction) {
      throw new Error('Wallet not connected or missing required methods');
    }

    console.log('Clock in attempt...');
    console.log('User account:', wallet.publicKey.toString());

    // Derive the user account PDA
    const [userAccount] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('user'), wallet.publicKey.toBuffer()],
      program.programId
    );

    // Get current day as a 64-bit little-endian integer
    const now = new Date();
    const dayBuffer = Buffer.alloc(8);
    dayBuffer.writeBigUInt64LE(BigInt(Math.floor(now.getTime() / (24 * 60 * 60 * 1000))), 0);

    // Derive the attendance record PDA
    const [attendanceRecord] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('attendance'),
        wallet.publicKey.toBuffer(),
        dayBuffer
      ],
      program.programId
    );
    console.log('Attendance record:', attendanceRecord.toString());
    console.log('Current day:', Math.floor(now.getTime() / (24 * 60 * 60 * 1000)));

    try {
      // Create the instruction
      const instruction = await program.methods
        .clockIn()
        .accounts({
          userAccount,
          attendanceRecord,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

      // Create a new transaction
      const transaction = new web3.Transaction().add(instruction);

      // Get the latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send the transaction
      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log('Clock in successful:', signature);
      return signature;
    } catch (error) {
      console.error('Clock in failed:', error);
      throw error;
    }
  };

  const getUserAttendance = async () => {
    if (!wallet.publicKey || !program) {
      throw new Error('Wallet not connected');
    }

    try {
      const [userAccount] = await web3.PublicKey.findProgramAddress(
        [Buffer.from('user'), wallet.publicKey.toBuffer()],
        program.programId
      );

      const userData = await program.account.userAccount.fetch(userAccount);
      return userData;
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      throw error;
    }
  };

  return {
    clockIn,
    getUserAttendance,
    isConnected,
  };
}; 