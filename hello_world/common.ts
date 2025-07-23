import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    PlutusScript,
    serializePlutusScript,
    UTxO
    , resolvePlutusScriptAddress
} from "@meshsdk/core";
import { applyParamsToScript } from "@meshsdk/core-csl";
import blueprint from "./plutus.json";

export const blockchainProvider = new BlockfrostProvider('previewQHpuufLsFntdTvMtD9fQMHxpoWhF0qqG');

export const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: 'mnemonic',
        words: []
    },
});
export function getScript() {
    const scriptCbor = applyParamsToScript(
        blueprint.validators[0].compiledCode,
        []
    );
    const script: PlutusScript = {
        code: scriptCbor,
        version: "V3"
    }

    const scriptAddr = serializePlutusScript(
        { code: scriptCbor, version: "V3" }, undefined, 0
    ).address;

    return { scriptCbor, scriptAddr };
}

export function getTxBuilder() {
    return new MeshTxBuilder({
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
        verbose: true,
    });
}

// reusable function to get a UTxO by transaction hash
export async function getUtxoByTxHash(txHash: string): Promise<UTxO> {
    const utxos = await blockchainProvider.fetchUTxOs(txHash);
    if (utxos.length === 0) {
        throw new Error("UTxO not found");
    }
    return utxos[0];
}


export async function getWalletInfoForTx(wallet) {
    const utxos = await wallet.getUtxos();
    const walletAddress = await wallet.getChangeAddress();
    const collateral = (await wallet.getCollateral())[0];
    return { utxos, walletAddress, collateral };
}
export async function getUtxoForTx(address: string, txHash: string, wallet: any) {
    const utxos: UTxO[] = await wallet.fetchAddressUTxOs(address);
    const utxo = utxos.find(function (utxo: UTxO) {
        return utxo.input.txHash === txHash;
    });

    if (!utxo) throw new Error("No UTXOs found in getUtxoForTx method.");
    return utxo;
}
