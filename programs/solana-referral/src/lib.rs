use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_instruction,
    program::invoke,
    system_program,
};

declare_id!("C6aYXSjJmuYU7hRrLRAto1JWiFQFU2o5nU3P7RDb2zos");

#[program]
pub mod referral_program {
    use super::*;

    pub fn purchase_package(ctx: Context<PurchasePackage>) -> Result<()> {
        let total_amount: u64 = ctx.accounts.user.to_account_info().lamports();
        let LAMPORTS_PER_SOL: u64 = 1_000_000_000; // Number of lamports in one SOL
        let transfer_amount: u64 = LAMPORTS_PER_SOL / 10; // 0.1 SOL in lamports
        let mut distributed_amount: u64 = 0;
    
        for account_info in ctx.remaining_accounts.iter() {
            // Ensure the account is writable and not a signer
            if !account_info.is_writable || account_info.is_signer {
                return Err(ErrorCode::InvalidAccount.into());
            }
    
            // Construct the transfer instruction
            let transfer_instruction = system_instruction::transfer(
                &ctx.accounts.user.key(),
                account_info.key,
                transfer_amount,
            );
    
            // Perform the transfer
            invoke(
                &transfer_instruction,
                &[
                    ctx.accounts.user.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info()
                ],
            )?;

            distributed_amount += transfer_amount;
        }

        let remaining =  total_amount - distributed_amount;
        
        let r_transfer_instruction = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.lp_wallet.key(),
            remaining,
        );
    
        // Invoke the transfer instruction
        invoke(
            &r_transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.lp_wallet.clone(),
            ],
        )?;
    
        Ok(())
    }
    
}

#[derive(Accounts)]
pub struct PurchasePackage<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: The lp_wallet is used to transfer the remaining SOL.
    #[account(mut)]
    pub lp_wallet: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The paid amount is too low. The minimum required is 0.5 SOL.")]
    AmountTooLow,
    #[msg("The receiver account is not writable.")]
    ReceiverNotWritable,
    #[msg("Invalid account provided.")]
    InvalidAccount,
}
