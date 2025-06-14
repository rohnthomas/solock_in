import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';
import { useCallback, useEffect, useState } from 'react';
import type { ClockInSystem, UserAccount } from '../types';
import { IDL } from '../idl/clock_in_system';

// Program ID from your Anchor.toml
const PROGRAM_ID = new web3.PublicKey('3QX9pzZwbd7uNmvBqiPW8YAV8ECV9v2v77L5pwGaSRAg');

export const useClockInSystem = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Idl> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the program
  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    const program = new Program(IDL as Idl, PROGRAM_ID, provider);
    setProgram(program);
  }, [connection, wallet]);

  // Find PDA for user account
  const findUserAccountPDA = useCallback(async (userPublicKey: web3.PublicKey) => {
    const [pda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('user'), userPublicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Find PDA for attendance system
  const findAttendanceSystemPDA = useCallback(async () => {
    const [pda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('attendance_system')],
      PROGRAM_ID
    );
    return pda;
  }, []);

  // Initialize attendance system
  const initializeAttendanceSystem = useCallback(async (name: string) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const attendanceSystemPDA = await findAttendanceSystemPDA();

      const tx = await program.methods
        .initializeAttendanceSystem(name)
        .accounts({
          attendanceSystem: attendanceSystemPDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, findAttendanceSystemPDA]);

  // Register user
  const registerUser = useCallback(async (name: string) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const userAccountPDA = await findUserAccountPDA(wallet.publicKey);
      const attendanceSystemPDA = await findAttendanceSystemPDA();

      const tx = await program.methods
        .registerUser(name)
        .accounts({
          userAccount: userAccountPDA,
          attendanceSystem: attendanceSystemPDA,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, findUserAccountPDA, findAttendanceSystemPDA]);

  // Clock in
  const clockIn = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const userAccountPDA = await findUserAccountPDA(wallet.publicKey);
      const attendanceRecord = web3.Keypair.generate();

      const tx = await program.methods
        .clockIn()
        .accounts({
          userAccount: userAccountPDA,
          attendanceRecord: attendanceRecord.publicKey,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([attendanceRecord])
        .rpc();

      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, findUserAccountPDA]);

  // Get user attendance
  const getUserAttendance = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const userAccountPDA = await findUserAccountPDA(wallet.publicKey);

      const userAccount = await (program.account as any).userAccount.fetch(userAccountPDA) as UserAccount;
      return userAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, findUserAccountPDA]);

  return {
    program,
    loading,
    error,
    initializeAttendanceSystem,
    registerUser,
    clockIn,
    getUserAttendance,
  };
}; 