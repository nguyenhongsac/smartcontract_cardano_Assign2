// Import necessary utilities from MeshSDK and local common module
import {
  Asset,
  deserializeAddress,
  deserializeDatum,
  mConStr0,
  mConStr1,
  MeshTxBuilder,
  MeshValue,
  pubKeyAddress,
  pubKeyHash,
  signData,
  SLOT_CONFIG_NETWORK,
  unixTimeToEnclosingSlot,
  BlockfrostProvider
} from "@meshsdk/core";
import {
  getScript,
  getTxBuilder,
  getUtxoByTxHash,
  getWalletInfoForTx,
  wallet,
} from "./common";

// Main async function to unlock assets from a time-locked smart contract
async function main() {
  try {
    // Define transaction hash for the vesting UTxO
    const txHash =
      "7792ed3102ac3938691c1e21d36ac1fc9245ad2767e9f45ad5f7888ee884645d";

    // Fetch vesting UTxO by transaction hash
    const vestingUtxo = await getUtxoByTxHash(txHash);
    console.log("Vesting UTXO:", vestingUtxo);

    // Fetch wallet info: UTxOs, address, and collateral
    const { utxos, walletAddress, collateral } = await getWalletInfoForTx(wallet);
    const { input: collateralInput, output: collateralOutput } = collateral;

    // Get Plutus script address and CBOR code
    const { scriptAddr, scriptCbor } = getScript();

    // Extract public key hash from wallet address
    const { pubKeyHash } = deserializeAddress(walletAddress);

    // Deserialize datum from vesting UTxO
    const datum = await deserializeDatum(vestingUtxo.output.plutusData!);
    console.log("Datum:", datum);

    // Calculate invalidBefore slot for transaction validity
    const invalidBefore = unixTimeToEnclosingSlot(
      Math.max(Number(datum.fields[2].int), Date.now() - 15000),
      SLOT_CONFIG_NETWORK.preview
    ) + 1;
    console.log("Invalid Before Slot:", invalidBefore);

    // Initialize transaction builder
    const txBuilder = getTxBuilder();

    // Build transaction to unlock assets from vesting UTxO
    await txBuilder
      .spendingPlutusScriptV3() // Specify Plutus V3 script
      .txIn(
        vestingUtxo.input.txHash, // UTxO transaction hash
        vestingUtxo.input.outputIndex, // UTxO output index
        vestingUtxo.output.amount, // UTxO amount
        scriptAddr // Script address
      )
      .spendingReferenceTxInInlineDatumPresent() // Indicate inline datum
      .spendingReferenceTxInRedeemerValue("") // Empty redeemer
      .txInScript(scriptCbor) // Attach Plutus script
      .txOut(walletAddress, []) // Output to wallet address (no assets specified)
      .txInCollateral(
        collateralInput.txHash, // Collateral transaction hash
        collateralInput.outputIndex, // Collateral output index
        collateralOutput.amount, // Collateral amount
        collateralOutput.address // Collateral address
      )
      .invalidBefore(invalidBefore) // Set transaction validity start
      .requiredSignerHash(pubKeyHash) // Specify required signer
      .changeAddress(walletAddress) // Set change address to wallet
      .selectUtxosFrom(utxos) // Select wallet UTxOs for transaction
      .setNetwork("preview") // Set network to Preview
      .complete(); // Finalize transaction

    // Get unsigned transaction hex
    const unsignedTx = txBuilder.txHex;

    // Sign transaction with wallet (partial signing enabled)
    const signedTx = await wallet.signTx(unsignedTx, true);

    // Submit transaction and get transaction hash
    const txhash = await wallet.submitTx(signedTx);

    // Log transaction hash
    console.log("Transaction Hash:", txhash);
  } catch (error) {
    // Handle errors during execution
    console.error("An error occurred:", error);
  }
}

// Execute main function with error handling
main().catch(error => {
  console.error("Unhandled error:", error);
});