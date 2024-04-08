const anchor = require('@project-serum/anchor');
const { SystemProgram, Keypair } = anchor.web3;
const fs = require('fs');
const idl = require("../target/idl/referral_program.json");

// Load the wallet keypair
const keypairPath = '/home/ancestor/.config/solana/id.json';
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, 'utf8')));
const wallet = new anchor.Wallet(Keypair.fromSecretKey(secretKey));


// Define the localnet connection with the specific wallet
const connection = new anchor.web3.Connection('http://localhost:8899', 'confirmed');
const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
anchor.setProvider(provider);

// Assume you have the IDL already defined as `idl`
const programId = new anchor.web3.PublicKey("C6aYXSjJmuYU7hRrLRAto1JWiFQFU2o5nU3P7RDb2zos");
const program = new anchor.Program(idl, programId, provider);

async function main() {
    console.log('balance:', await connection.getBalance(provider.wallet.publicKey));

    // User account (signer) - Using the wallet loaded from the specified path
    const user = provider.wallet.publicKey;

    // Generate an lp_wallet account
    const lpWallet = Keypair.generate();

    // Generate dummy remaining accounts
    const remainingAccounts = [];
    for (let i = 0; i < 5; i++) {
        let newAccount = Keypair.generate();
        remainingAccounts.push({
            pubkey: newAccount.publicKey,
            isWritable: true,
            isSigner: false,
        });
    }

    // Call the purchase_package function
    try {
        await program.rpc.purchasePackage({
            accounts: {
                user: user,
                lpWallet: lpWallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [wallet.payer],
            remainingAccounts: remainingAccounts,
        });
        console.log("Purchase package transaction successful!");
    } catch (error) {
        console.error("Error making purchase package transaction:", error);
    }
}

main().then(() => console.log('Script execution completed.'));
