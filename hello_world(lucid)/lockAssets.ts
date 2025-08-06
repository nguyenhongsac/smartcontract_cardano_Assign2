// Import required modules from Lucid library for Cardano blockchain interaction
import {
    Blockfrost,
    Data,
    Lucid,
    SpendingValidator,
    TxHash,
    Address,
    Addresses
} from "https://deno.land/x/lucid/mod.ts";

// Initialize Lucid with Blockfrost provider for Cardano Preview network
const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0", // Blockfrost API endpoint
        "" // Blockfrost API key
    )
});

// Select wallet using mnemonic seed phrase for transaction signing
lucid.selectWalletFromSeed('');

// Define PlutusV2 smart contract (spending validator) in hex format
const script: SpendingValidator = lucid.newScript({
    type: "PlutusV2",
    script: '58f1010000323232323232323222232325333008323232533300b002100114a06644646600200200644a66602200229404c8c94ccc040cdc78010028a511330040040013014002375c60240026eb0c038c03cc03cc03cc03cc03cc03cc03cc03cc020c008c020014dd71801180400399b8f375c6002600e00a91010c48656c6c6f20776f726c6421002300d00114984d958c94ccc020cdc3a400000226464a66601a601e0042930b1bae300d00130060041630060033253330073370e900000089919299980618070010a4c2c6eb8c030004c01401058c01400c8c014dd5000918019baa0015734aae7555cf2ab9f5742ae881'
});
// Convert Plutus script to Cardano contract address
const contractAddress: Address = script.toAddress();

// Get public key hash from wallet address
const { payment } = Addresses.inspect( await lucid.wallet.address(),);
const publicKeyHash = payment.hash;
console.log("Public key hash: ", publicKeyHash);


// Define datum structure with an owner field (string)
const Datum = Data.Object({
    owner: Data.String,
});

// Create static TypeScript type for datum
type Datum = Data.Static<typeof Datum>;

// Async function to lock assets (lovelace) with datum into smart contract
async function lockAssets(
    lovelace: bigint, // Amount to lock in lovelace
    { datum }: { datum: string } // Datum to attach to the transaction
): Promise<TxHash> {
    // Create and commit transaction to lock assets with datum
    const tx = await lucid
        .newTx()
        .payToContract(contractAddress, { Inline: datum }, { lovelace: lovelace })
        .commit();
    
    // Sign and finalize the transaction
    const signedTx = await tx.sign().commit();
    
    // Submit transaction and return its hash
    return signedTx.submit();
}

// Main async function to execute the logic
async function main() {
    // Create datum with wallet's public key hash (or default if undefined)
    const datum = Data.to<Datum>({
        owner: publicKeyHash ?? '00000000000000000000000000000000000000000000000000000000',
    }, Datum);

    // Lock 5,000,000 lovelace with the datum
    const txHash = await lockAssets(5000000n, { datum });

    // Wait for transaction confirmation on the blockchain
    await lucid.awaitTx(txHash);

    // Log transaction hash and datum
    console.log(`tx hash: ${txHash}\ndatum: ${datum}`);
}

// Run the main function
main();