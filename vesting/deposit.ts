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
async function main() {
  const { utxos, walletAddress } = await getWalletInfoForTx(wallet);
  const assets: Asset[] = [
    {
      unit: "lovelace",
      quantity: "3000000",
    },
    {
      unit: "3bc49fa8439037997d0db3f4ad6f7b4372976ed1a575c921658c787968656c6c6f20776f726c6c6c64",
      quantity: '100'
    }
  ];
  //console.log("Wallet Address: ", walletAddress);
  const { scriptAddr } = getScript();
  console.log("Script Address: ", scriptAddr);
  const value = MeshValue.fromAssets(assets);
  console.log(value);
  const txBuilder = getTxBuilder();
  const lockUntilTimeStamp = new Date().getTime() + 1*60*1000;

  const beneficiary =
  "addr_test1qqwkave5e46pelgysvg6mx0st5zhte7gn79srscs8wv2qp5qkfvca3f7kpx3v3rssm4j97f63v5whrj8yvsx6dac9xrqyqqef6";
  const { pubKeyHash: ownerPubKeyHash } = deserializeAddress(walletAddress);
  const { pubKeyHash: beneficiaryPubKeyHash } = deserializeAddress(beneficiary);

  await txBuilder
    .txOut(scriptAddr, assets)
    .txOutInlineDatumValue(
      mConStr0([ownerPubKeyHash, beneficiaryPubKeyHash, lockUntilTimeStamp])
    )
    .changeAddress(walletAddress)
    .selectUtxosFrom(utxos)
    .complete();
  const unsignedTx = txBuilder.txHex;
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);
  console.log("txhash: " + txHash);
//  console.log("Khoa");
}
main();
