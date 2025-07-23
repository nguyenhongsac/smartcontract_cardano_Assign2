import { Asset, deserializeAddress, mConStr0 } from "@meshsdk/core";
import { getScript, getTxBuilder, wallet } from "./common";
 
async function main() {
  const assets: Asset[] = [
    {
      unit: "lovelace",
      quantity: "10000000",
    },
  ];
  const utxos = await wallet.getUtxos();
  const walletAddress = (await wallet.getUsedAddresses())[0];
  const { scriptAddr } = getScript();
  const signerHash = deserializeAddress(walletAddress).pubKeyHash;
  const txBuilder = getTxBuilder();
  await txBuilder
    .txOut(scriptAddr, assets) 
    .txOutDatumHashValue(mConStr0([signerHash])) 
    .changeAddress(walletAddress)
    .selectUtxosFrom(utxos)
    .complete();
  const unsignedTx = txBuilder.txHex;
 
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);
  console.log(`10 tADA locked into the contract at Tx ID: ${txHash}`);
}
 
main();