Smart contract - Cardano
Assignment 2
Start: set up blockforst_api_key and wallet_seed
1. Use mesh.js - in folder hello_world(mesh)
    - Lock 10 ADA: npx tsx lock.ts
    txHash: 219f1101d41733cca8ff813f4a6e3ea5dca56d4b2ad7e32a5d5c71e0dc69d100
    - Unlock 10 ADA above: npx tsx unlock.ts
    txHash: 0f8760b30a9f9dbf971932c4b368a923a2155b106837db4ae64ea8069bd88c7d
2. Use lucid - in folder hello_world(lucid)
    - Lock 1, 5, 10 ADA: deno run --allow-all lockAssets.ts
    txHash: c7156be069f70da67a86664205702393ce1d04dd896b3112e26d2c1ed3789870
            3d5cdbd36e74376f27d27bdb42647eb75b09e5981ea52f5bef96a4ead6d1ae22
            1fed0405e291da3b2067908a12535082f9941983bec3535be55ecbd98d76d335
    datum: d8799f581c92a5a3c27f96ba88d3049f0e11d1f2f25765e634e303aa9a2ede5e2aff
    - Unlock: deno run --allow-all unlockAssets.ts
    txHash: 908e97f4a43921255b4da7766f79e1539ac88760feca781fee526b726942f8e0
    redeemer: d8799f4c48656c6c6f20776f726c6421ff