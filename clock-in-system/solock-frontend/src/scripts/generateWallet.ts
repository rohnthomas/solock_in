import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a new keypair
const keypair = Keypair.generate();

// Create the keypair object
const keypairData = {
  publicKey: keypair.publicKey.toString(),
  privateKey: Array.from(keypair.secretKey),
};

// Save to a JSON file
const outputPath = path.join(__dirname, '..', '..', 'wallet.json');
fs.writeFileSync(outputPath, JSON.stringify(keypairData, null, 2));

console.log('New wallet generated!');
console.log('Public Key:', keypair.publicKey.toString());
console.log('Wallet details saved to:', outputPath);
console.log('\nIMPORTANT: Fund this wallet with some SOL before running the initialization script!'); 