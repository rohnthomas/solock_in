import { FC, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { IDL } from '../idl/clock_in_system';
import { PROGRAM_ID } from '../App';

interface AttendanceRecord {
  day: number;
  timestamp: number;
}

const AttendanceHistory: FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const fetchAttendanceHistory = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const provider = new AnchorProvider(connection, window.solana, {});
      const program = new Program(IDL, PROGRAM_ID, provider);

      // Fetch user account to get total clock-ins
      const [userAccount] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from('user'), publicKey.toBuffer()],
        program.programId
      );

      const userAccountInfo = await program.account.userAccount.fetch(userAccount);
      const totalClockIns = userAccountInfo.totalClockIns.toNumber();

      // Fetch recent attendance records
      const recentRecords: AttendanceRecord[] = [];
      const currentDay = Math.floor(Date.now() / 86400000);

      for (let i = 0; i < 7; i++) {
        const day = currentDay - i;
        const [attendanceRecord] = web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from('attendance'),
            publicKey.toBuffer(),
            new Uint8Array(new Uint64Array([day]).buffer),
          ],
          program.programId
        );

        try {
          const record = await program.account.attendanceRecord.fetch(attendanceRecord);
          recentRecords.push({
            day: record.day.toNumber(),
            timestamp: record.timestamp.toNumber(),
          });
        } catch (err) {
          // Record doesn't exist for this day
          continue;
        }
      }

      setRecords(recentRecords);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchAttendanceHistory();
    }
  }, [publicKey]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Attendance History</h2>
      
      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-gray-600">No attendance records found</div>
      ) : (
        <div className="space-y-2">
          {records.map((record, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-700">{formatDate(record.timestamp)}</span>
              <span className="text-green-600 font-medium">Clocked In</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory; 