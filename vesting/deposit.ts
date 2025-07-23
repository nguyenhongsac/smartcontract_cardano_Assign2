// Import necessary utilities from MeshSDK and local common module
import {
  Asset,
  deserializeAddress,
  mConStr0,
  MeshValue,
} from "@meshsdk/core";
import {
  getScript,
  getTxBuilder,
  wallet,
  getWalletInfoForTx,
} from "./common";

// Main async function to lock assets into a smart contract with a time lock
async function main() {
  // Fetch wallet info: UTxOs and address
  const { utxos, walletAddress } = await getWalletInfoForTx(wallet);

  // Define assets to lock: 3,000,000 lovelace and 100 tokens of a custom asset
  const assets: Asset[] = [
    {
      unit: "lovelace",
      quantity: "3000000",
    },
    {
      unit: "3bc49fa8439037997d0db3f4ad6f7b4372976ed1a575c921658c787968656c6c6f20776f726c6c64",
      quantity: "100",
    },
  ];

  // Get Plutus script address
  const { scriptAddr } = getScript();
  console.log("Script Address: ", scriptAddr);

  // Convert assets to MeshValue format for transaction
  const value = MeshValue.fromAssets(assets);
  console.log(value);

  // Initialize transaction builder
  const txBuilder = getTxBuilder();

  // Set lock duration (1 minute from current time)
  const lockUntilTimeStamp = new Date().getTime() + 1 * 60 * 1000;

  // Define beneficiary address
  const beneficiary =
    "addr_test1qqwkave5e46pelgysvg6mx0st5zhte7gn79srscs8wv2qp5qkfvca3f7kpx3v3rssm4j97f63v5whrj8yvsx6dac9xrqyqqef6";

  // Extract public key hashes for wallet (owner) and beneficiary
  const { pubKeyHash: ownerPubKeyHash } = deserializeAddress(walletAddress);
  const { pubKeyHash: beneficiaryPubKeyHash } = deserializeAddress(beneficiary);

  // Build transaction: lock assets with inline datum
  await txBuilder
    .txOut(scriptAddr, assets) // Send assets to script address
    .txOutInlineDatumValue(
      mConStr0([ownerPubKeyHash, beneficiaryPubKeyHash, lockUntilTimeStamp]) // Attach datum with owner, beneficiary, and timestamp
    )
    .changeAddress(walletAddress) // Set change address to wallet
    .selectUtxosFrom(utxos) // Select wallet UTxOs for transaction
    .complete(); // Finalize transaction

  // Get unsigned transaction hex
  const unsignedTx = txBuilder.txHex;

  // Sign transaction with wallet
  const signedTx = await wallet.signTx(unsignedTx);

  // Submit transaction and get transaction hash
  const txHash = await wallet.submitTx(signedTx);

  // Log transaction hash
  console.log("txhash: " + txHash);
}

// Execute main function
main();