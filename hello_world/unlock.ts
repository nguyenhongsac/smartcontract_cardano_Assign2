import {
    deserializeAddress,
    mConStr0,
    stringToHex,
  } from "@meshsdk/core";
  import { getScript, getTxBuilder, getUtxoByTxHash, getWalletInfoForTx, wallet } from "./common";
import { blockchainProvider } from "./common";
   
  async function main() {
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const scriptUtxo = (await blockchainProvider.fetchUTxOs('a922a19b5434c32d7f787ad63066d5998aac19f1d40f1df5a417cc4b83b09293'))[0];
    console.log("Script UTXO: ", scriptUtxo);
    const { scriptCbor } = getScript();
    console.log("Script Cbor: ", scriptCbor);
    const signerHash = deserializeAddress(walletAddress).pubKeyHash;
    const message = "Hello, World!";
    const txBuilder = getTxBuilder();
    await txBuilder
      .spendingPlutusScript("V3")
      .txIn( 
        scriptUtxo.input.txHash,
        scriptUtxo.input.outputIndex,
        scriptUtxo.output.amount,
        scriptUtxo.output.address
      )
      .txInScript(scriptCbor)
      .txInRedeemerValue(mConStr0([stringToHex(message)])) 
      .txInDatumValue(mConStr0([signerHash]))
      .requiredSignerHash(signerHash)
      .changeAddress(walletAddress)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .selectUtxosFrom(utxos)
      .complete();
    const unsignedTx = txBuilder.txHex;
   
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);
    console.log(`10 tADA unlocked from the contract at Tx ID: ${txHash}`);
  }
   
  main();