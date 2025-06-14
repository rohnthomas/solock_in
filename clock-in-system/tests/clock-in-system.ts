import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ClockInSystem } from "../target/types/clock_in_system";
import { expect } from "chai";

describe("clock-in-system", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ClockInSystem as Program<ClockInSystem>;
  const authority = provider.wallet as anchor.Wallet;
  
  // Generate keypairs for test users
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();

  // PDAs
  const [attendanceSystemPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("attendance_system")],
    program.programId
  );

  const [user1AccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), user1.publicKey.toBuffer()],
    program.programId
  );

  const [user2AccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), user2.publicKey.toBuffer()],
    program.programId
  );

  before(async () => {
    // Airdrop SOL to test users
    const airdropTx1 = await provider.connection.requestAirdrop(
      user1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx1);

    const airdropTx2 = await provider.connection.requestAirdrop(
      user2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx2);
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

  it("Register user 1", async () => {
    const tx = await program.methods
      .registerUser("Alice")
      .accounts({
        userAccount: user1AccountPda,
        attendanceSystem: attendanceSystemPda,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log("User 1 registration transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(user1AccountPda);
    const attendanceSystem = await program.account.attendanceSystem.fetch(
      attendanceSystemPda
    );

    expect(userAccount.name).to.equal("Alice");
    expect(userAccount.isRegistered).to.be.true;
    expect(userAccount.totalClockIns.toString()).to.equal("0");
    expect(attendanceSystem.totalUsers.toString()).to.equal("1");
  });

  it("Register user 2", async () => {
    const tx = await program.methods
      .registerUser("Bob")
      .accounts({
        userAccount: user2AccountPda,
        attendanceSystem: attendanceSystemPda,
        user: user2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    console.log("User 2 registration transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(user2AccountPda);
    const attendanceSystem = await program.account.attendanceSystem.fetch(
      attendanceSystemPda
    );

    expect(userAccount.name).to.equal("Bob");
    expect(userAccount.isRegistered).to.be.true;
    expect(attendanceSystem.totalUsers.toString()).to.equal("2");
  });

  it("User 1 clocks in", async () => {
    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    const currentDayBytes = Buffer.alloc(8);
    currentDayBytes.writeBigUInt64LE(BigInt(currentDay));

    const [attendanceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), user1.publicKey.toBuffer(), currentDayBytes],
      program.programId
    );

    const tx = await program.methods
      .clockIn()
      .accounts({
        userAccount: user1AccountPda,
        attendanceRecord: attendanceRecordPda,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log("User 1 clock-in transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(user1AccountPda);
    
    // Fetch the attendance record manually since it's now an AccountInfo
    const attendanceRecordAccount = await provider.connection.getAccountInfo(attendanceRecordPda);
    expect(attendanceRecordAccount).to.not.be.null;
    
    expect(userAccount.totalClockIns.toString()).to.equal("1");
  });

  it("User 1 cannot clock in twice on the same day", async () => {
    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    const currentDayBytes = Buffer.alloc(8);
    currentDayBytes.writeBigUInt64LE(BigInt(currentDay));

    const [attendanceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), user1.publicKey.toBuffer(), currentDayBytes],
      program.programId
    );

    try {
      await program.methods
        .clockIn()
        .accounts({
          userAccount: user1AccountPda,
          attendanceRecord: attendanceRecordPda,
          user: user1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("AlreadyClockedInToday");
    }
  });

  it("User 2 clocks in", async () => {
    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    const currentDayBytes = Buffer.alloc(8);
    currentDayBytes.writeBigUInt64LE(BigInt(currentDay));

    const [attendanceRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), user2.publicKey.toBuffer(), currentDayBytes],
      program.programId
    );

    const tx = await program.methods
      .clockIn()
      .accounts({
        userAccount: user2AccountPda,
        attendanceRecord: attendanceRecordPda,
        user: user2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    console.log("User 2 clock-in transaction signature:", tx);

    const userAccount = await program.account.userAccount.fetch(user2AccountPda);
    expect(userAccount.totalClockIns.toString()).to.equal("1");
  });

  it("Get user attendance", async () => {
    const tx = await program.methods
      .getUserAttendance()
      .accounts({
        userAccount: user1AccountPda,
        user: user1.publicKey,
      })
      .signers([user1])
      .rpc();

    console.log("Get user attendance transaction signature:", tx);
  });
});
