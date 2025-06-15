import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';

// Program ID from your Anchor.toml
const PROGRAM_ID = new PublicKey('GMV2GPn4XJwz8uocRtRiwDEYjgBRnZKXRt9c3uxWktos');

async function initializeAttendanceSystem() {
  // Connect to Solana devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Get the Phantom wallet provider
  const provider = window.solana;
  if (!provider) {
    console.error('Please install Phantom wallet');
    return;
  }

  // Create Anchor provider
  const anchorProvider = new AnchorProvider(
    connection,
    provider,
    { commitment: 'confirmed' }
  );

  // Create program instance
  const program = new Program(IDL, PROGRAM_ID, anchorProvider);

  try {
    // Find PDA for attendance system
    const [attendanceSystem] = PublicKey.findProgramAddressSync(
      [Buffer.from('attendance_system')],
      program.programId
    );

    console.log('Initializing attendance system...');
    console.log('Authority:', provider.publicKey.toString());
    console.log('Attendance System PDA:', attendanceSystem.toString());

    // Initialize the attendance system
    const tx = await program.methods
      .initializeAttendanceSystem('SoLock-In System')
      .accounts({
        attendanceSystem,
        authority: provider.publicKey,
        systemProgram: PublicKey.systemProgramId,
      })
      .rpc();

    console.log('\nAttendance system initialized successfully!');
    console.log('Transaction signature:', tx);
  } catch (error) {
    console.error('Error initializing attendance system:', error);
  }
}

// Export the function to be called from the frontend
export { initializeAttendanceSystem }; 