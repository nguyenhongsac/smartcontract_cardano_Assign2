// Import required modules from Lucid library for Cardano blockchain interaction
import {
    Blockfrost,
    Data,
    Lucid,
    SpendingValidator,
    TxHash,
    fromText,
    Redeemer,
    UTxO,
    Constr,
    Addresses,
} from "https://deno.land/x/lucid/mod.ts";

const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0", // Blockfrost API endpoint
        "" // Blockfrost API key
    )
});
lucid.selectWalletFromSeed('');

// Define PlutusV2 smart contract (spending validator) in hex format
const script: SpendingValidator = lucid.newScript({
    type: "PlutusV2",
    script: '58f1010000323232323232323222232325333008323232533300b002100114a06644646600200200644a66602200229404c8c94ccc040cdc78010028a511330040040013014002375c60240026eb0c038c03cc03cc03cc03cc03cc03cc03cc03cc020c008c020014dd71801180400399b8f375c6002600e00a91010c48656c6c6f20776f726c6421002300d00114984d958c94ccc020cdc3a400000226464a66601a601e0042930b1bae300d00130060041630060033253330073370e900000089919299980618070010a4c2c6eb8c030004c01401058c01400c8c014dd5000918019baa0015734aae7555cf2ab9f5742ae881'
});
const scriptAddress = script.toAddress();

const { payment } = Addresses.inspect( await lucid.wallet.address(),);
const publicKeyHash = payment.hash;

// Define datum structure with an owner field (string)
const Datum = Data.Object({
    owner: Data.String,
});

// Create static TypeScript type for datum
type Datum = Data.Static<typeof Datum>;

// Async function to unlock assets from smart contract using UTxOs and redeemer
async function unlockAssests(
    utxos: UTxO[], // List of unspent transaction outputs
    { validator, redeemer }: { validator: SpendingValidator; redeemer: Redeemer } // Validator script and redeemer
): Promise<TxHash> {
    // Create and commit transaction to unlock assets
    const tx = await lucid
        .newTx()
        .collectFrom(utxos, redeemer) // Collect UTxOs with redeemer
        .addSigner(publicKeyHash) // Add wallet as signer
        .attachScript(validator) // Attach Plutus validator
        .commit();
    
    // Sign and finalize the transaction
    const signedTx = await tx.sign().commit();

    // Submit transaction and return its hash
    return signedTx.submit();
}

// Main async function to execute the logic
async function main() {
    // Fetch all UTxOs at the contract address
    const scriptUTxOs = await lucid.utxosAt(scriptAddress);

    // Filter UTxOs where the datum's owner matches the wallet's public key hash
    const utxos = scriptUTxOs.filter((utxo) => {
        try {
            const temp = Data.from<Datum>(utxo.datum ?? '', Datum); // Parse datum
            if (temp.owner === publicKeyHash) {
                return true; // Include UTxO if owner matches
            }
            return false;
        } catch (e) {
            console.log(e); // Log errors during datum parsing
            return false;
        }
    });
    console.log("UTXOs: ", utxos);

    // Create redeemer with "Hello world!" in hex format
    const redeemer = Data.to(new Constr(0, [fromText("Hello world!")]));

    // Unlock assets from filtered UTxOs using the validator and redeemer
    const txHash = await unlockAssests(utxos, { validator: script, redeemer });

    // Wait for transaction confirmation on the blockchain
    await lucid.awaitTx(txHash);

    // Log transaction hash and redeemer
    console.log(`tx hash: ${txHash}\nredeemer: ${redeemer}`);
}

// Run the main function
main();