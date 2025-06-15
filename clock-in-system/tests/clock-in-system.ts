import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ClockInSystem } from "../target/types/clock_in_system";
import { expect } from "chai";

describe("clock-in-system", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ClockInSystem as Program<ClockInSystem>;
  const authority = provider.wallet as anchor.Wallet;
  
  // Generate keypair for test user
  const user = anchor.web3.Keypair.generate();

  // PDAs
  const [attendanceSystemPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("attendance_system")],
    program.programId
  );

  const [userAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), user.publicKey.toBuffer()],
    program.programId
  );

  // Helper function to request airdrop with retries
  async function requestAirdropWithRetry(
    connection: anchor.web3.Connection,
    publicKey: anchor.web3.PublicKey,
    amount: number,
    maxRetries = 3
  ): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const signature = await connection.requestAirdrop(publicKey, amount);
        await connection.confirmTransaction(signature);
        return signature;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
    throw new Error("Failed to request airdrop after multiple retries");
  }

  before(async () => {
    try {
      // Request airdrop for test user
      console.log("Requesting airdrop for test user...");
      const signature = await requestAirdropWithRetry(
        provider.connection,
        user.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      console.log("Airdrop successful, signature:", signature);
    } catch (error) {
      console.error("Failed to get airdrop:", error);
      throw error;
    }
  });

  it("Initialize attendance system", async () => {
    const tx = await program.methods
      .initializeAttendanceSystem("Daily Clock-In System")
      .accounts({
        attendanceSystem: attendanceSystemPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction signature:", tx);

    const attendanceSystemAccount = await program.account.attendanceSystem.fetch(
      attendanceSystemPda
    );

    expect(attendanceSystemAccount.name).to.equal("Daily Clock-In System");
    expect(attendanceSystemAccount.totalUsers.toString()).to.equal("0");
    expect(attendanceSystemAccount.authority.toString()).to.equal(
      authority.publicKey.toString()
    );
  });

  it("Register user", async () => {
    const tx = await program.methods
      .registerUser("TestUser")
      .accounts({
        userAccount: userAccountPda,
        attendanceSystem: attendanceSystemPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("User registration transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(userAccountPda);
    const attendanceSystem = await program.account.attendanceSystem.fetch(
      attendanceSystemPda
    );

    expect(userAccount.name).to.equal("TestUser");
    expect(userAccount.isRegistered).to.be.true;
    expect(userAccount.totalClockIns.toString()).to.equal("0");
    expect(attendanceSystem.totalUsers.toString()).to.equal("1");
  });

  it("User clocks in", async () => {
    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    const currentDayBytes = Buffer.alloc(8);
    currentDayBytes.writeBigUInt64LE(BigInt(currentDay));

    const [attendanceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), user.publicKey.toBuffer(), currentDayBytes],
      program.programId
    );

    const tx = await program.methods
      .clockIn()
      .accounts({
        userAccount: userAccountPda,
        attendanceRecord: attendanceRecordPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Clock-in transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(userAccountPda);
    expect(userAccount.totalClockIns.toString()).to.equal("1");
  });

  it("Get user attendance", async () => {
    const tx = await program.methods
      .getUserAttendance()
      .accounts({
        userAccount: userAccountPda,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    console.log("Get user attendance transaction signature:", tx);
  });
});
