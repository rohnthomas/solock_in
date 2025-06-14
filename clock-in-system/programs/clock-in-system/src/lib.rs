use anchor_lang::prelude::*;
use std::io::Write;

declare_id!("3QX9pzZwbd7uNmvBqiPW8YAV8ECV9v2v77L5pwGaSRAg");

#[program]
pub mod clock_in_system {
    use super::*;

    pub fn initialize_attendance_system(
        ctx: Context<InitializeAttendanceSystem>,
        name: String,
    ) -> Result<()> {
        let attendance_system = &mut ctx.accounts.attendance_system;
        attendance_system.authority = ctx.accounts.authority.key();
        attendance_system.name = name;
        attendance_system.total_users = 0;
        attendance_system.bump = ctx.bumps.attendance_system;
        
        msg!("Attendance system initialized: {}", attendance_system.name);
        Ok(())
    }

    pub fn register_user(ctx: Context<RegisterUser>, name: String) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let attendance_system = &mut ctx.accounts.attendance_system;
        
        user_account.authority = ctx.accounts.user.key();
        user_account.name = name;
        user_account.total_clock_ins = 0;
        user_account.is_registered = true;
        user_account.bump = ctx.bumps.user_account;
        
        attendance_system.total_users = attendance_system.total_users.checked_add(1).unwrap();
        
        msg!("User registered: {} ({})", user_account.name, user_account.authority);
        Ok(())
    }

    pub fn clock_in(ctx: Context<ClockIn>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        
        let clock = Clock::get()?;
        let current_day = get_current_day(clock.unix_timestamp);
        
        // Create PDA for attendance record
        let current_day_bytes = current_day.to_le_bytes();
        let (attendance_record_pda, bump) = Pubkey::find_program_address(
            &[
                b"attendance",
                ctx.accounts.user.key().as_ref(),
                &current_day_bytes,
            ],
            ctx.program_id,
        );
        
        // Check if attendance record already exists
        let attendance_record_info = &ctx.accounts.attendance_record;
        if attendance_record_info.key() != attendance_record_pda {
            return Err(ErrorCode::InvalidAttendanceRecord.into());
        }
        
        // Check if account already exists (user already clocked in today)
        if attendance_record_info.data_len() > 0 {
            return Err(ErrorCode::AlreadyClockedInToday.into());
        }
        
        // Initialize the attendance record account
        let rent = Rent::get()?;
        let required_lamports = rent.minimum_balance(AttendanceRecord::LEN);
        
        // Transfer lamports for rent
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: attendance_record_info.clone(),
                },
            ),
            required_lamports,
        )?;
        
        // Allocate space for the account
        anchor_lang::system_program::allocate(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Allocate {
                    account_to_allocate: attendance_record_info.clone(),
                },
                &[&[
                    b"attendance",
                    ctx.accounts.user.key().as_ref(),
                    &current_day_bytes,
                    &[bump],
                ]],
            ),
            AttendanceRecord::LEN as u64,
        )?;
        
        // Assign the account to our program
        anchor_lang::system_program::assign(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Assign {
                    account_to_assign: attendance_record_info.clone(),
                },
                &[&[
                    b"attendance",
                    ctx.accounts.user.key().as_ref(),
                    &current_day_bytes,
                    &[bump],
                ]],
            ),
            ctx.program_id,
        )?;
        
        // Create and serialize the attendance record
        let attendance_record = AttendanceRecord {
            user: ctx.accounts.user.key(),
            day: current_day,
            timestamp: clock.unix_timestamp,
            bump,
        };
        
        // Write the data to the account
        let mut data = attendance_record_info.try_borrow_mut_data()?;
        let mut cursor = std::io::Cursor::new(&mut data[..]);
        attendance_record.try_serialize(&mut cursor)?;
        
        // Update user stats
        user_account.total_clock_ins = user_account.total_clock_ins.checked_add(1).unwrap();
        
        msg!(
            "User {} clocked in on day {} at timestamp {}",
            user_account.name,
            current_day,
            clock.unix_timestamp
        );
        
        Ok(())
    }

    pub fn get_user_attendance(ctx: Context<GetUserAttendance>) -> Result<()> {
        let user_account = &ctx.accounts.user_account;
        
        msg!("User: {}", user_account.name);
        msg!("Total clock-ins: {}", user_account.total_clock_ins);
        msg!("Authority: {}", user_account.authority);
        
        Ok(())
    }
}

// Helper function to get current day (days since Unix epoch)
fn get_current_day(timestamp: i64) -> u64 {
    (timestamp / 86400) as u64 // 86400 seconds in a day
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeAttendanceSystem<'info> {
    #[account(
        init,
        payer = authority,
        space = AttendanceSystem::LEN,
        seeds = [b"attendance_system"],
        bump
    )]
    pub attendance_system: Account<'info, AttendanceSystem>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserAccount::LEN,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(
        mut,
        seeds = [b"attendance_system"],
        bump = attendance_system.bump
    )]
    pub attendance_system: Account<'info, AttendanceSystem>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClockIn<'info> {
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.is_registered @ ErrorCode::UserNotRegistered
    )]
    pub user_account: Account<'info, UserAccount>,
    
    /// CHECK: This account will be initialized in the instruction
    #[account(mut)]
    pub attendance_record: AccountInfo<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetUserAttendance<'info> {
    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    pub user: Signer<'info>,
}

#[account]
pub struct AttendanceSystem {
    pub authority: Pubkey,
    pub name: String,
    pub total_users: u64,
    pub bump: u8,
}

impl AttendanceSystem {
    const LEN: usize = 8 + // discriminator
        32 + // authority
        4 + 50 + // name (String with 50 chars max)
        8 + // total_users
        1; // bump
}

#[account]
pub struct UserAccount {
    pub authority: Pubkey,
    pub name: String,
    pub total_clock_ins: u64,
    pub is_registered: bool,
    pub bump: u8,
}

impl UserAccount {
    const LEN: usize = 8 + // discriminator
        32 + // authority
        4 + 50 + // name (String with 50 chars max)
        8 + // total_clock_ins
        1 + // is_registered
        1; // bump
}

#[account]
pub struct AttendanceRecord {
    pub user: Pubkey,
    pub day: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl AttendanceRecord {
    const LEN: usize = 8 + // discriminator
        32 + // user
        8 + // day
        8 + // timestamp
        1; // bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("User is not registered")]
    UserNotRegistered,
    #[msg("User has already clocked in today")]
    AlreadyClockedInToday,
    #[msg("Invalid attendance record PDA")]
    InvalidAttendanceRecord,
}