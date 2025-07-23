import {
    deserializeAddress,
    mConStr0,
    stringToHex,
  } from "@meshsdk/core";
  import { getScript, getTxBuilder, getUtxoByTxHash, getWalletInfoForTx, wallet } from "./common";
import { blockchainProvider } from "./common";
   
  async function main() {
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const scriptUtxo = (await blockchainProvider.fetchUTxOs('f1a657b7a9648eab6572248fd15c28d7ab055890a9cbe54fb2bb8c9b96391c80'))[0];
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