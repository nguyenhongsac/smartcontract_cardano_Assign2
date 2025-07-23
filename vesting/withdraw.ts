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

async function main() {
  try {
    const txHash =
      "7792ed3102ac3938691c1e21d36ac1fc9245ad2767e9f45ad5f7888ee884645d";
    const vestingUtxo = await getUtxoByTxHash(txHash);
    console.log("Vesting UTXO:", vestingUtxo);
    const { utxos, walletAddress, collateral } = await getWalletInfoForTx(wallet);
    const { input: collateralInput, output: collateralOutput } = collateral;
    const { scriptAddr, scriptCbor } = getScript();
    const { pubKeyHash } = deserializeAddress(walletAddress);
    
    const datum =await deserializeDatum(vestingUtxo.output.plutusData!);
    console.log("Datum:", datum);
    const invalidBefore =
     unixTimeToEnclosingSlot(Math.max(
        (Number(datum.fields[2].int)), Date.now() - 15000),
        SLOT_CONFIG_NETWORK.preview,
      ) + 1;
    console.log("Invalid Before Slot:", invalidBefore);
    const txBuilder = getTxBuilder();
    await txBuilder
      .spendingPlutusScriptV3()
      .txIn(
        vestingUtxo.input.txHash,
        vestingUtxo.input.outputIndex,
        vestingUtxo.output.amount,
        scriptAddr
      )
      .spendingReferenceTxInInlineDatumPresent()
      .spendingReferenceTxInRedeemerValue("")
      .txInScript(scriptCbor)
      .txOut(walletAddress, [])
      .txInCollateral(
        collateralInput.txHash,
        collateralInput.outputIndex,
        collateralOutput.amount,
        collateralOutput.address
      )
      .invalidBefore(invalidBefore)     
      .requiredSignerHash(pubKeyHash)
      .changeAddress(walletAddress)
      .selectUtxosFrom(utxos)
      .setNetwork("preview")
      .complete();
    const unsignedTx = txBuilder.txHex;
    const signedTx = await wallet.signTx(unsignedTx, true);
    const txhash = await wallet.submitTx(signedTx);
    console.log("Transaction Hash:", txhash);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
});