import * as anchor from '@project-serum/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import assert from 'assert';

describe('Referral program initialization', () => {
  // Load the Anchor program
  const program = anchor.workspace.ReferralProgram;

  // Initialize the test provider
  const provider = anchor.AnchorProvider.local();

  // Configure the client to use the local cluster
  anchor.setProvider(provider);

  // Generate a new keypair for the referral state account
  const referralState = anchor.web3.Keypair.generate();

  it('Initializes the referral program', async () => {
    // Create a new user account
    const user = anchor.web3.Keypair.generate();

    // Initialize the referral program
    await program.rpc.initialize({
      accounts: {
        referralState: referralState.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [referralState, user],
    });

    // Fetch the referral state from the blockchain
    const state = await program.account.referralState.fetch(referralState.publicKey);

    // Assert that the referrals HashMap is empty after initialization
    assert.ok(state.referrals instanceof Map && state.referrals.size === 0);
  });
});
