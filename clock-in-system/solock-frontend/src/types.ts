import { PublicKey } from '@solana/web3.js';

export type ClockInSystem = {
  "version": "0.1.0",
  "name": "clock_in_system",
  "instructions": [
    {
      "name": "clockIn",
      "accounts": [
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "user"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "attendanceRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "getUserAttendance",
      "accounts": [
        {
          "name": "userAccount",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "user"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeAttendanceSystem",
      "accounts": [
        {
          "name": "attendanceSystem",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "attendance_system"
              }
            ]
          }
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "registerUser",
      "accounts": [
        {
          "name": "userAccount",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "user"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "attendanceSystem",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "attendance_system"
              }
            ]
          }
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "AttendanceSystem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "UserAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "attendanceCount",
            "type": "u64"
          },
          {
            "name": "lastClockIn",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UserAlreadyRegistered",
      "msg": "User is already registered"
    },
    {
      "code": 6001,
      "name": "UserNotRegistered",
      "msg": "User is not registered"
    },
    {
      "code": 6002,
      "name": "InvalidAuthority",
      "msg": "Invalid authority"
    }
  ]
};

export type ClockInSystemAccounts = {
  clockIn: {
    userAccount: PublicKey;
    attendanceRecord: PublicKey;
    user: PublicKey;
    systemProgram: PublicKey;
  };
  getUserAttendance: {
    userAccount: PublicKey;
    user: PublicKey;
  };
  initializeAttendanceSystem: {
    attendanceSystem: PublicKey;
    authority: PublicKey;
    systemProgram: PublicKey;
  };
  registerUser: {
    userAccount: PublicKey;
    attendanceSystem: PublicKey;
    user: PublicKey;
    systemProgram: PublicKey;
  };
};

export type ClockInSystemArgs = {
  clockIn: Record<string, never>;
  getUserAttendance: Record<string, never>;
  initializeAttendanceSystem: {
    name: string;
  };
  registerUser: {
    name: string;
  };
};

export type AttendanceSystem = {
  authority: PublicKey;
  name: string;
};

export type UserAccount = {
  user: PublicKey;
  name: string;
  attendanceCount: bigint;
  lastClockIn: bigint;
}; 