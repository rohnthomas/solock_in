import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function airdrop() {
  // Load wallet from the generated file
  const walletPath = path.join(__dirname, '..', '..', 'wallet.json');
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData.privateKey));

  // Connect to local Solana network
  const connection = new Connection('http://localhost:8899', 'confirmed');

  console.log('Requesting airdrop for wallet:', wallet.publicKey.toString());

  try {
    // Request airdrop of 2 SOL
    const signature = await connection.requestAirdrop(
      wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    // Get the new balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log('Airdrop successful!');
    console.log('New balance:', balance / LAMPORTS_PER_SOL, 'SOL');
  } catch (error) {
    console.error('Error requesting airdrop:', error);
  }
}

// Run the airdrop
airdrop(); 